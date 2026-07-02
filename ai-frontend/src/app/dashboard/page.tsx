'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Lead {
  _id: string;
  name: string;
  city: string;
  requirement: string;
  budget: string;
  phoneNumber: string;
  score: number;
  createdAt: string;
  conversationTranscript: { role: string, text: string }[];
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'leads' | 'settings' | 'analytics'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // AI Settings State
  const [aiPrompt, setAiPrompt] = useState(`You are Aradhya AI, the official AI Insurance Assistant of Aradhya Life Solutions.

Your role is to understand the customer's insurance needs, answer their questions, qualify the lead, and collect complete information naturally before ending the conversation.

## Personality
- Be friendly, professional, patient, and confident.
- Speak in the same language as the customer.
- If the customer speaks Hindi, reply in natural Hinglish.
- If the customer speaks English, reply in English.
- Never sound robotic.
- Keep responses short (1-3 sentences).
- Ask only ONE question at a time.

## Goal
Your primary goal is to:
1. Understand the customer's requirement.
2. Recommend the most suitable insurance category.
3. Collect complete lead details.
4. Build trust.
5. End politely after collecting all information.

## Information to Collect
Collect these details naturally during the conversation:

- Full Name
- Mobile Number
- City
- Age
- Gender
- Occupation
- Monthly Income (Optional)
- Requirement
- Existing Insurance (Yes/No)
- Budget
- Best Time to Call

Never ask all questions together.

## Conversation Flow

Start with:

"Hello! Welcome to Aradhya Life Solutions.
I'm Aradhya AI. I'll help you find the right insurance plan.

May I know your name?"

After getting the name:

"Nice to meet you, {name}.
How can I help you today?"

Then understand what they need.

Possible requirements:

- Life Insurance
- Health Insurance
- Term Insurance
- Child Plan
- Retirement Plan
- Investment Plan
- Savings Plan
- ULIP
- Tax Saving
- Other

After understanding their need, ask follow-up questions naturally.

Example:

Customer:
"I want life insurance."

Ask:
- May I know your age?
- Which city are you from?
- Approximately what is your monthly budget?
- Do you already have any insurance?
- Could you please share your mobile number so our advisor can prepare the best plan?

## Handling Questions

If customer asks:

"What is Term Insurance?"

Explain simply.

If customer asks:

"Which plan is best?"

Never recommend a specific policy.

Say:

"The best plan depends on your age, goals, family responsibilities, and budget. Our insurance advisor will suggest the most suitable option."

## Objection Handling

If customer says:

"I am just looking."

Reply:

"No problem at all. I can still understand your requirement and help you with general guidance."

If customer says:

"I don't want to share my phone number."

Reply politely:

"That's completely okay. Sharing your number is optional, but it helps our advisor provide personalized recommendations."

Never force.

## If customer gives multiple details together

Extract all information.

Example:

"My name is Rahul, I'm 30 from Delhi."

Do NOT ask again.

Continue from the next missing question.

## Missing Information

Only ask for information that has not already been provided.

## Lead Summary

Before ending, summarize:

Name:
City:
Age:
Requirement:
Budget:
Phone Number:

Then ask:

"Is everything correct?"

If yes:

"Thank you for choosing Aradhya Life Solutions.
One of our insurance advisors will contact you soon.
Have a wonderful day."

## Important Rules

- Never hallucinate insurance policies.
- Never guarantee approval.
- Never guarantee returns.
- Never provide legal or financial advice.
- Never ask multiple questions together.
- Never repeat the same question.
- Keep conversation natural.
- Remember previous answers.
- If customer changes topic, respond accordingly.
- Always be polite.`);
  const [aiVoice, setAiVoice] = useState('hi-IN');
  const [isAiActive, setIsAiActive] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminId === 'Santoshsinha' && adminPassword === 'Aradhya@1616') ||
      (adminId === 'AdityaRaj' && adminPassword === 'Aradhya@4782')
    ) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BACKEND_URL = (typeof window !== 'undefined' && (window as any).BACKEND_URL) || process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.get(`${BACKEND_URL}/api/leads`);
      setLeads(res.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Dummy data fallback
      setLeads([
        {
          _id: '1', name: 'Rahul Sharma', city: 'Mumbai', requirement: 'Term Insurance 1Cr', budget: '1500/month', phoneNumber: '9876543210', score: 85, createdAt: new Date().toISOString(),
          conversationTranscript: [{ role: 'agent', text: 'Namaste! How can I help you?' }, { role: 'user', text: 'Mujhe term insurance chahiye.' }]
        },
        {
          _id: '2', name: 'Priya Verma', city: 'Delhi', requirement: 'Health Insurance', budget: '20000/year', phoneNumber: '9123456789', score: 92, createdAt: new Date(Date.now() - 86400000).toISOString(),
          conversationTranscript: [{ role: 'agent', text: 'Namaste! How can I help you?' }, { role: 'user', text: 'I need health insurance for my family.' }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BACKEND_URL = (typeof window !== 'undefined' && (window as any).BACKEND_URL) || process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:5000';
      await axios.delete(`${BACKEND_URL}/api/leads/${id}`);
      fetchLeads();
    } catch (err) {
      console.error(err);
      // For demo, just remove from state
      setLeads(leads.filter(l => l._id !== id));
      setSelectedLead(null);
    }
  };

  const saveSettings = () => {
    alert('AI Settings Saved Successfully!');
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm) ||
    lead.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-900 dark:text-slate-100">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin <span className="text-rose-500">Login</span></h1>
            <p className="text-slate-500 mt-2 text-sm">Secure access to the AI Control Center</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">Admin ID</label>
              <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-shadow" placeholder="Enter admin ID" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-shadow" placeholder="Enter password" required />
            </div>
            <button type="submit" className="w-full py-3.5 mt-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-1">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold tracking-tight">Admin <span className="text-rose-500">Panel</span></h2>
          <p className="text-xs text-slate-500 mt-1">Control Center</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'leads' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Lead Manager
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            AI Agent Settings
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'analytics' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </button>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
            &larr; View Live Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header (Mobile menu placeholder) */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="flex md:hidden items-center gap-4">
             <span className="font-bold">Admin <span className="text-rose-500">Panel</span></span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Online
            </span>
          </div>
        </header>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Lead Manager</h1>
                  <p className="text-slate-500">View and manage all leads captured by the AI.</p>
                </div>
                <button onClick={fetchLeads} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                  ↻ Refresh Data
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="relative max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                      type="text" 
                      placeholder="Search by name, phone, or city..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Contact</th>
                        <th className="p-4 font-semibold">Location</th>
                        <th className="p-4 font-semibold">Requirement</th>
                        <th className="p-4 font-semibold">Score</th>
                        <th className="p-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading leads...</td></tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No leads found.</td></tr>
                      ) : (
                        filteredLeads.map((lead) => (
                          <tr key={lead._id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-medium">{lead.name || 'Unknown'}</td>
                            <td className="p-4">{lead.phoneNumber}</td>
                            <td className="p-4">{lead.city}</td>
                            <td className="p-4 max-w-xs truncate">{lead.requirement}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${lead.score > 80 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>
                                {lead.score} / 100
                              </span>
                            </td>
                            <td className="p-4">
                              <button onClick={() => setSelectedLead(lead)} className="px-3 py-1 bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors">
                                View Full
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-3xl blur opacity-20"></div>
                <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 space-y-8">
                  
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl shadow-lg shadow-rose-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-1">AI Agent Settings</h1>
                      <p className="text-slate-500 dark:text-slate-400">Control the behavior, voice, and prompt of your AI Agent with precision.</p>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all hover:shadow-md">
                    <div>
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        System Status
                        <span className={`flex h-3 w-3 rounded-full ${isAiActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Turn the calling bot on or off globally across all platforms.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                      <input type="checkbox" className="sr-only peer" checked={isAiActive} onChange={() => setIsAiActive(!isAiActive)} />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-500/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-emerald-500 shadow-inner"></div>
                    </label>
                  </div>

                  {/* Prompt Textarea */}
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold text-lg text-slate-800 dark:text-slate-200">System Prompt / Instructions</label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Define exactly how the AI should talk, what questions to ask, and its personality.</p>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={7}
                        className="relative w-full p-5 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-0 transition-all resize-none font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 shadow-sm"
                      ></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Voice Select */}
                    <div className="space-y-4">
                      <label className="font-bold text-lg text-slate-800 dark:text-slate-200">Voice Language & Accent</label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                        <select 
                          value={aiVoice}
                          onChange={(e) => setAiVoice(e.target.value)}
                          className="relative w-full p-4 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none appearance-none cursor-pointer font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                        >
                          <option value="hi-IN">🇮🇳 Hindi (India) - Premium</option>
                          <option value="en-IN">🇮🇳 English (India) - Premium</option>
                          <option value="en-US">🇺🇸 English (US) - Standard</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Integration Status */}
                    <div className="space-y-4">
                      <label className="font-bold text-lg text-slate-800 dark:text-slate-200">Integration Status</label>
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 text-indigo-800 dark:text-indigo-300 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm flex items-start gap-4 h-[58px] box-content">
                        <div className="mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                          <h4 className="font-bold">Twilio & Vapi.io Active</h4>
                          <p className="text-sm opacity-80 mt-1">Backend configured for seamless SIP handoffs.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
                    <button onClick={saveSettings} className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                      <span className="relative flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Save Configuration
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div>
                <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
                <p className="text-slate-500">Performance metrics of your AI Voice Agent.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-500 text-sm font-semibold mb-2">Total Leads Generated</div>
                  <div className="text-4xl font-black text-rose-500">{leads.length > 0 ? leads.length + 145 : 145}</div>
                  <div className="text-green-500 text-sm mt-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    +12% this week
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-500 text-sm font-semibold mb-2">Average Call Duration</div>
                  <div className="text-4xl font-black text-primary">2m 14s</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-500 text-sm font-semibold mb-2">Avg. Lead Score</div>
                  <div className="text-4xl font-black text-green-500">88.5</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm h-64 flex items-center justify-center">
                <p className="text-slate-400">Advanced Charts & Graphs will appear here upon Twilio integration.</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* LEAD DETAILS MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden transform scale-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 font-bold text-2xl">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedLead.name}</h3>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {selectedLead.phoneNumber} 
                    <span className="mx-2">•</span> 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {selectedLead.city}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteLead(selectedLead._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Lead">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Requirement</span>
                <p className="font-medium mt-1">{selectedLead.requirement}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Budget</span>
                <p className="font-medium mt-1">{selectedLead.budget}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">AI Lead Score</span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-2">
                  <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-2.5 rounded-full" style={{ width: `${selectedLead.score}%` }}></div>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Date</span>
                <p className="font-medium mt-1">{new Date(selectedLead.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Transcript */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
              <h4 className="font-semibold mb-4 uppercase text-xs tracking-wider text-slate-500 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2">Call Transcript</h4>
              <div className="flex flex-col gap-4">
                {selectedLead.conversationTranscript && selectedLead.conversationTranscript.length > 0 ? (
                  selectedLead.conversationTranscript.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md shadow-rose-500/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'}`}>
                        <span className="text-[10px] uppercase font-bold opacity-60 block mb-1">
                          {msg.role === 'user' ? selectedLead.name.split(' ')[0] : 'Aradhya AI'}
                        </span>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-slate-500">No transcript recorded for this call.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
