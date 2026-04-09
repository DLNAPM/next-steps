import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Lock, Sparkles, AlertCircle, Save, History, X, Plus, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SavedSession {
  id: string;
  name: string;
  createdAt: any;
  messages: { role: 'user' | 'model', text: string }[];
}

export default function Advisor() {
  const { user } = useAuth();
  const { records } = useData();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    {
      role: 'model',
      text: "Hello! I'm your AI Family Financial Advisor. I can answer questions about your financial data, estate planning, and help you model different scenarios. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && !user.isDemo && !user.isGuest && db) {
      fetchSavedSessions();
    }
  }, [user]);

  const fetchSavedSessions = async () => {
    if (!user || !db) return;
    try {
      const q = query(
        collection(db, 'advisor_sessions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const sessions: SavedSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() } as SavedSession);
      });
      setSavedSessions(sessions);
    } catch (err) {
      console.error("Error fetching saved sessions:", err);
    }
  };

  const handleSaveSession = async () => {
    if (!user || !db || !sessionName.trim() || messages.length <= 1) return;
    
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'advisor_sessions'), {
        userId: user.uid,
        name: sessionName.trim(),
        messages: messages,
        createdAt: serverTimestamp()
      });
      
      setCurrentSessionId(docRef.id);
      setIsSaveModalOpen(false);
      setSessionName('');
      await fetchSavedSessions();
    } catch (err) {
      console.error("Error saving session:", err);
      setError("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadSession = (session: SavedSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const startNewSession = () => {
    setMessages([
      {
        role: 'model',
        text: "Hello! I'm your AI Family Financial Advisor. I can answer questions about your financial data, estate planning, and help you model different scenarios. How can I assist you today?"
      }
    ]);
    setCurrentSessionId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (!user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Feature</h2>
          <p className="text-lg text-slate-600 max-w-lg mb-8">
            The AI Family Financial Advisor is available exclusively to Premium members. Upgrade your account to ask scenario-based questions and get personalized insights based on your financial data.
          </p>
          <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (user?.isDemo) {
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      if (userMessageCount >= 1) {
        setError("Demo mode is limited to 1 question. Please sign in to continue using the AI Advisor.");
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      // Format the user's financial data to provide context
      const contextData = JSON.stringify(records, null, 2);
      
      const systemInstruction = `You are an expert Family Financial Planner and Estate Planning Advisor. 
You are helping a user understand their financial situation and plan for the future.
Here is the user's current financial data in JSON format:
${contextData}

Use this data to answer their questions accurately. If they ask about scenarios (e.g., "What happens if I pass away?"), use their specific assets, debts, insurance, and trusts to provide a personalized answer.
Do not give formal legal or tax advice, but provide educational guidance based on standard financial planning principles. Be empathetic, professional, and clear.`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // We need to build the chat history
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // Add the new user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      } else {
        throw new Error("No response received from the AI.");
      }
    } catch (err) {
      console.error("Error generating AI response:", err);
      setError("Sorry, I encountered an error while processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar for Saved Sessions */}
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden",
        isSidebarOpen ? "w-64 md:w-80 opacity-100" : "w-0 opacity-0 md:w-0 border-0"
      )}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Saved Sessions
          </h3>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-slate-100">
          <button 
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {savedSessions.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No saved sessions yet.</p>
          ) : (
            savedSessions.map(session => (
              <button
                key={session.id}
                onClick={() => loadSession(session)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-colors",
                  currentSessionId === session.id ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <MessageSquare className={cn("w-5 h-5 mt-0.5 shrink-0", currentSessionId === session.id ? "text-indigo-600" : "text-slate-400")} />
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{session.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                title="View Saved Sessions"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Financial Advisor</h2>
              <p className="text-sm text-slate-500">Premium Support</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSaveModalOpen(true)}
            disabled={messages.length <= 1 || currentSessionId !== null}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            title={currentSessionId ? "Session already saved" : "Save this session"}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{currentSessionId ? 'Saved' : 'Save Session'}</span>
          </button>
        </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-indigo-600">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your financial data or estate planning scenarios..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            disabled={isLoading || currentSessionId !== null}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || currentSessionId !== null}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {currentSessionId !== null ? (
          <p className="text-xs text-amber-600 mt-2 text-center font-medium">
            You are viewing a saved session. Start a new chat to ask more questions.
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-2 text-center">
            AI Advisor provides educational guidance, not formal legal or tax advice.
          </p>
        )}
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                Save Session
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                Give this session a name so you can refer back to these questions and answers later.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Estate Tax Questions"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSession()}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={!sessionName.trim() || isSaving}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
