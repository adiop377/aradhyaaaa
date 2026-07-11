'use client';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function AIAssistant() {
  const [isCalling, setIsCalling] = useState(false);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatInput, setChatInput] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const isCallingRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    socketRef.current = socket;
    isCallingRef.current = isCalling;
  }, [socket, isCalling]);

  // Fallback Web Speech API for testing without real Twilio/Vapi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech API ONLY ONCE safely
    try {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'en-IN'; // English + Hinglish support
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(prev => [...prev, { role: 'user', text }]);
          if (socketRef.current) {
            socketRef.current.emit('user_message', { text });
          }
        };

        recognitionRef.current.onend = () => {
          if (isCallingRef.current && !isSpeakingRef.current) {
            try { recognitionRef.current.start(); } catch { /* ignore error */ }
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          // If not allowed (e.g. HTTP on mobile), fail gracefully
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
             console.warn("Microphone access denied. User must use text input.");
          }
        };
      }
    } catch (err) {
      console.warn("Speech Recognition is not fully supported on this device/browser.", err);
    }
    synthRef.current = window.speechSynthesis;
  }, []); // Run only once

  const startCall = () => {
    setIsCalling(true);
    isCallingRef.current = true;
    setTranscript([]);
    // Dynamic IP detection for local network testing on mobile
    let defaultBackendUrl = 'http://localhost:5000';
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      defaultBackendUrl = `http://${window.location.hostname}:5000`;
    }

    // Connect to Node.js backend (Dynamic for Production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BACKEND_URL = (typeof window !== 'undefined' && (window as any).BACKEND_URL) || process.env.NEXT_PUBLIC_AI_BACKEND_URL || defaultBackendUrl;
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('agent_message', (data: {text: string, endCall?: boolean}) => {
      setTranscript(prev => [...prev, { role: 'agent', text: data.text }]);
      speakText(data.text, data.endCall);
    });

    // Request microphone permission and unlock audio immediately when call starts (required for Mobile)
    if (synthRef.current) {
      const unlockUtterance = new SpeechSynthesisUtterance('');
      synthRef.current.speak(unlockUtterance);
    }

    // Request microphone permission immediately when call starts
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    }
  };

  const stopCall = () => {
    setIsCalling(false);
    isCallingRef.current = false;
    if (socket) socket.disconnect();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthRef.current) synthRef.current.cancel();
  };

  const speakText = (text: string, endCall?: boolean) => {
    if (!synthRef.current) return;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore error */ } // pause listening completely
    }
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Natural speed
    
    // Store utterance in window to prevent garbage collection bug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).currentUtterance = utterance;

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (endCall) {
        stopCall();
      } else if (isCallingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore error */ }
      }
    };
    
    synthRef.current.speak(utterance);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    
    // Stop listening temporarily to avoid double input
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    setTranscript(prev => [...prev, { role: 'user', text: chatInput }]);
    socketRef.current.emit('user_message', { text: chatInput });
    setChatInput('');
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md mx-auto">
      <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
        {/* Animated AI Orb */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 transition-all duration-700 ${isCalling ? (isSpeaking ? 'animate-pulse scale-110 shadow-[0_0_50px_rgba(225,29,72,0.6)]' : 'scale-100 shadow-[0_0_30px_rgba(225,29,72,0.3)]') : 'scale-90 opacity-50 grayscale'}`}></div>
        
        {/* Inner core */}
        <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center z-10">
           {isCalling ? (
             <div className="flex gap-1">
               <div className={`w-2 bg-rose-400 rounded-full ${isSpeaking ? 'animate-bounce h-8' : 'h-3'}`}></div>
               <div className={`w-2 bg-rose-400 rounded-full ${isSpeaking ? 'animate-bounce h-12 delay-75' : 'h-3'}`}></div>
               <div className={`w-2 bg-rose-400 rounded-full ${isSpeaking ? 'animate-bounce h-6 delay-150' : 'h-3'}`}></div>
             </div>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
           )}
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Aradhya AI Agent</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {isCalling ? (isSpeaking ? 'Agent is speaking...' : 'Listening to you...') : 'Ready to assist you in Hindi & English'}
        </p>
      </div>

      {!isCalling ? (
        <button 
          onClick={startCall}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-lg shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Talk with AI Agent
        </button>
      ) : (
        <button 
          onClick={stopCall}
          className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.28 3.684A1 1 0 008.331 3H5z" /></svg>
          End Call
        </button>
      )}

      {/* Transcript Log */}
      {transcript.length > 0 && (
        <div className="mt-8 w-full max-h-48 overflow-y-auto bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-sm flex flex-col gap-3">
          {transcript.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Chat Input */}
      {isCalling && (
        <form onSubmit={handleChatSubmit} className="mt-4 w-full flex gap-2">
          <input 
            type="text" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your reply here..." 
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-none focus:ring-2 focus:ring-rose-500 outline-none text-sm shadow-inner"
          />
          <button type="submit" className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      )}
    </div>
  );
}
