require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Basic Lead Schema
const leadSchema = new mongoose.Schema({
  name: String,
  city: String,
  requirement: String,
  budget: String,
  phoneNumber: String,
  score: { type: Number, default: 0 },
  conversationTranscript: [{ role: String, text: String }],
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

// API Route to fetch leads for Admin Dashboard
app.get('/api/leads', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const leads = await Lead.find().sort({ createdAt: -1 });
      return res.json(leads);
    }
    // Fallback to local JSON if DB not connected
    const leadsFilePath = path.join(__dirname, 'leads.json');
    if (fs.existsSync(leadsFilePath)) {
      const leads = JSON.parse(fs.readFileSync(leadsFilePath, 'utf8'));
      const mappedLeads = leads.map((lead, i) => ({
        ...lead,
        _id: lead._id || `local_${Date.now()}_${i}`
      }));
      return res.json(mappedLeads.reverse());
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Route to save a lead manually (fallback)
app.post('/api/leads', async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    await newLead.save();
    res.status(201).json(newLead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Route to delete a lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && !id.startsWith('local_')) {
      await Lead.findByIdAndDelete(id);
      return res.json({ message: 'Lead deleted from MongoDB' });
    }
    // Fallback to local JSON
    const leadsFilePath = path.join(__dirname, 'leads.json');
    if (fs.existsSync(leadsFilePath)) {
      let leads = JSON.parse(fs.readFileSync(leadsFilePath, 'utf8'));
      // Remove by exact id if _id exists, else by some matching
      leads = leads.filter((l, i) => {
        const leadId = l._id || `local_${new Date(l.createdAt).getTime()}_${i}`; // approximate for demo
        return leadId !== id && l._id !== id;
      });
      fs.writeFileSync(leadsFilePath, JSON.stringify(leads, null, 2));
      return res.json({ message: 'Lead deleted locally' });
    }
    res.status(404).json({ error: 'Lead not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebSocket Connection for AI Conversation
io.on('connection', (socket) => {
  console.log('User connected to AI Agent:', socket.id);
  
  // AI Agent Memory and State
  let sessionMemory = [];
  let userState = 'AWAITING_LANGUAGE';
  let leadData = { name: '', city: '', requirement: '', budget: '', phoneNumber: '', age: '', existingInsurance: '', language: 'English' };

  // Start Conversation
  socket.emit('agent_message', { 
    text: "Hello! Welcome to Aradhya Life Solutions.\nWould you like to speak in Hindi or English? / क्या आप हिंदी में बात करना चाहेंगे या इंग्लिश में?",
    audioReady: false 
  });

  const saveLead = () => {
    const leadDataToSave = {
        _id: `local_${Date.now()}`,
        name: leadData.name || "New Caller",
        city: leadData.city || "Not Provided",
        requirement: `Req: ${leadData.requirement} | Age: ${leadData.age} | Ins: ${leadData.existingInsurance} | Lang: ${leadData.language}`,
        budget: leadData.budget || "TBD",
        phoneNumber: leadData.phoneNumber,
        conversationTranscript: sessionMemory,
        createdAt: new Date()
    };
    
    // Save to Local JSON file as Backup
    const leadsFilePath = path.join(__dirname, 'leads.json');
    try {
        let existingLeads = [];
        if (fs.existsSync(leadsFilePath)) {
            existingLeads = JSON.parse(fs.readFileSync(leadsFilePath, 'utf8'));
        }
        existingLeads.push(leadDataToSave);
        fs.writeFileSync(leadsFilePath, JSON.stringify(existingLeads, null, 2));
        console.log("Lead successfully saved locally in leads.json");
    } catch (e) {
        console.error("Failed to save lead locally", e);
    }

    // Only attempt MongoDB save if connected to avoid timeout errors
    if (mongoose.connection.readyState === 1) {
        const lead = new Lead(leadDataToSave);
        lead.save().catch(console.error);
    }
  };

  socket.on('user_message', (data) => {
    console.log('Received user message:', data.text);
    sessionMemory.push({ role: 'user', text: data.text });
    
    let text = data.text.toLowerCase();

    // Voice STT Phone Number Normalization
    const wordToDigit = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ek': '1', 'do': '2', 'teen': '3', 'chaar': '4', 'char': '4',
        'paanch': '5', 'panch': '5', 'chhah': '6', 'che': '6',
        'saat': '7', 'aath': '8', 'nau': '9', 'no': '9', 'shunya': '0'
    };

    Object.keys(wordToDigit).forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, wordToDigit[word]);
    });

    // Handle "double X" and "triple X"
    text = text.replace(/\b(?:double|dabal|do)\s*(\d)/gi, '$1$1');
    text = text.replace(/\b(?:triple|tibal|teen)\s*(\d)/gi, '$1$1$1');

    let aiResponse = "";

    if (text.match(/what is term insurance|term insurance kya hai/i)) {
        aiResponse = leadData.language === 'Hindi' 
            ? "Term insurance ek pure protection plan hai jisme kam premium par high life cover milta hai. Hamare advisor isko detail mein samjhayenge."
            : "Term insurance is a pure protection plan that provides a high life cover at a low premium for a specific period. Our advisor can explain it in detail.";
    }
    else if (text.match(/which plan is best|kaunsa plan acha hai/i)) {
        aiResponse = leadData.language === 'Hindi'
            ? "Best plan aapki age, goals aur budget par depend karta hai. Hamare expert aapko sabse sahi plan suggest karenge."
            : "The best plan depends on your age, goals, family responsibilities, and budget. Our insurance advisor will suggest the most suitable option.";
    }
    else if (text.match(/just looking|bas dekh raha/i)) {
        aiResponse = leadData.language === 'Hindi'
            ? "Koi baat nahi. Main aapki requirement samajh kar general guidance de sakta hoon."
            : "No problem at all. I can still understand your requirement and help you with general guidance.";
    }
    else if (text.match(/don't want to share my phone number|no number|number nahi/i) && userState === 'AWAITING_PHONE') {
        aiResponse = leadData.language === 'Hindi'
            ? "Koi baat nahi, number dena optional hai par isse hum aapko better recommend kar paate hain."
            : "That's completely okay. Sharing your number is optional, but it helps our advisor provide personalized recommendations.";
    }
    // Dynamic State Machine
    else if (userState === 'AWAITING_LANGUAGE') {
        if (text.match(/hindi|हिंदी|हिन्दी/i)) {
            leadData.language = 'Hindi';
            aiResponse = "Namaste! Main Aradhya Life Solutions ka AI assistant hoon. Main aapki sahi insurance plan chunne mein madad karunga. Kya main aapka naam jaan sakta hoon?";
        } else {
            leadData.language = 'English';
            aiResponse = "Hello! I'm Aradhya AI from Aradhya Life Solutions. I'll help you find the right insurance plan. May I know your name?";
        }
        userState = 'AWAITING_NAME';
    }
    else if (userState === 'AWAITING_NAME') {
        const nameMatch = text.match(/(?:नाम|naam|name is|नेम इस|माय नेम इस|i am|आई एम|this is|mein|मैं|मेरा नाम|mera naam|my name is)\s+([a-zA-Z\u0900-\u097F]+)/i);
        leadData.name = nameMatch ? nameMatch[1] : (data.text.split(' ').length <= 6 ? data.text.replace(/है|hoon|hu|hai/gi, '').trim() : "Friend");

        aiResponse = leadData.language === 'Hindi'
            ? `Aapse milkar acha laga, ${leadData.name.split(' ')[0]}. Main aaj aapki kaise madad kar sakta hoon?`
            : `Nice to meet you, ${leadData.name.split(' ')[0]}.\nHow can I help you today?`;
        userState = 'AWAITING_REQ';
    }
    else if (userState === 'AWAITING_REQ') {
        leadData.requirement = data.text;
        aiResponse = leadData.language === 'Hindi' ? "Aapki umar (age) kitni hai?" : "May I know your age?";
        userState = 'AWAITING_AGE';
    }
    else if (userState === 'AWAITING_AGE') {
        leadData.age = data.text;
        aiResponse = leadData.language === 'Hindi' ? "Aap kaunse shahar (city) se hain?" : "Which city are you from?";
        userState = 'AWAITING_CITY';
    }
    else if (userState === 'AWAITING_CITY') {
        leadData.city = data.text;
        aiResponse = leadData.language === 'Hindi' ? "Aapka mahine ka budget lagbhag kitna hai?" : "Approximately what is your monthly budget?";
        userState = 'AWAITING_BUDGET';
    }
    else if (userState === 'AWAITING_BUDGET') {
        leadData.budget = data.text;
        aiResponse = leadData.language === 'Hindi' ? "Kya aapke paas pehle se koi insurance hai?" : "Do you already have any insurance?";
        userState = 'AWAITING_EXISTING_INSURANCE';
    }
    else if (userState === 'AWAITING_EXISTING_INSURANCE') {
        leadData.existingInsurance = data.text;
        aiResponse = leadData.language === 'Hindi' 
            ? "Kripya apna 10-digit mobile number bataiye taaki hamare advisor aapke liye best plan taiyar kar sakein." 
            : "Could you please share your mobile number so our advisor can prepare the best plan?";
        userState = 'AWAITING_PHONE';
    }
    else if (userState === 'AWAITING_PHONE') {
        const potentialNumbers = text.replace(/\D/g, '');
        if (potentialNumbers.length >= 10) {
            leadData.phoneNumber = potentialNumbers.substring(0, 10);
            
            if (leadData.language === 'Hindi') {
                aiResponse = `Name: ${leadData.name}\nCity: ${leadData.city}\nAge: ${leadData.age}\nRequirement: ${leadData.requirement}\nBudget: ${leadData.budget}\nPhone Number: ${leadData.phoneNumber}\n\nKya yeh sab sahi hai?`;
            } else {
                aiResponse = `Name: ${leadData.name}\nCity: ${leadData.city}\nAge: ${leadData.age}\nRequirement: ${leadData.requirement}\nBudget: ${leadData.budget}\nPhone Number: ${leadData.phoneNumber}\n\nIs everything correct?`;
            }
            userState = 'AWAITING_CONFIRMATION';
        } else {
            aiResponse = leadData.language === 'Hindi'
                ? "Koi baat nahi. Number dena optional hai, par isse hamare advisor ko madad milti hai. Kya aap apna 10-digit mobile number de sakte hain?"
                : "That's completely okay. Sharing your number is optional, but it helps our advisor provide personalized recommendations. Or you can provide your 10-digit mobile number.";
        }
    }
    else if (userState === 'AWAITING_CONFIRMATION') {
        if (text.match(/(yes|haan|correct|right|yup|sahi|यस|हाँ|हां|करेक्ट|सही|जी|बिलकुल|bilkul|ji)/i)) {
            aiResponse = leadData.language === 'Hindi'
                ? "Aradhya Life Solutions chunne ke liye dhanyawad. Hamare insurance advisor jald hi aapse sampark karenge. Aapka din shubh ho!"
                : "Thank you for choosing Aradhya Life Solutions.\nOne of our insurance advisors will contact you soon.\nHave a wonderful day.";
            userState = 'COMPLETED';
            saveLead();
        } else {
            aiResponse = leadData.language === 'Hindi'
                ? "Maaf kijiyega, chaliye shuru se shuru karte hain. Kya main aapka naam jaan sakta hoon?"
                : "Oh, I apologize. Let's start over. May I know your name?";
            userState = 'AWAITING_NAME';
            let storedLang = leadData.language;
            leadData = { name: '', city: '', requirement: '', budget: '', phoneNumber: '', age: '', existingInsurance: '', language: storedLang };
        }
    }
    else if (userState === 'COMPLETED') {
        aiResponse = leadData.language === 'Hindi'
            ? "Dhanyawad! Hamare advisor jaldi hi aapko call karenge. Aapka din acha rahe!"
            : "Thank you! Our advisor will contact you soon. Have a great day!";
    }

    sessionMemory.push({ role: 'agent', text: aiResponse });
    
    // Simulate natural thinking delay (OP human-like feel)
    const delay = Math.random() * 1000 + 800; 
    setTimeout(() => {
        socket.emit('agent_message', { text: aiResponse, endCall: userState === 'COMPLETED' });
    }, delay);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aradhya-leads';
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`AI Backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB, but starting server anyway for testing...');
    server.listen(PORT, () => console.log(`AI Backend running on port ${PORT} (without DB)`));
  });
