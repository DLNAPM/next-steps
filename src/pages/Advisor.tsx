import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Lock, Sparkles, AlertCircle, Save, History, X, Plus, MessageSquare, Trash2, Share2, Printer, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SavedSession {
  id: string;
  name: string;
  createdAt: any;
  messages: { role: 'user' | 'model', text: string }[];
  sharedWithEmail?: string;
}

export default function Advisor() {
  const { user } = useAuth();
  const { records } = useData();
  const { settings } = useSettings();
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sessionToShare, setSessionToShare] = useState<SavedSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      
      const sharedQ = query(
        collection(db, 'advisor_sessions'),
        where('sharedWithEmail', '==', user.email),
        orderBy('createdAt', 'desc')
      );

      const [snapshot, sharedSnapshot] = await Promise.all([getDocs(q), getDocs(sharedQ)]);
      
      const sessions: SavedSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() } as SavedSession);
      });
      
      sharedSnapshot.forEach(doc => {
        // Only add if not already in the list (in case user shared with themselves)
        if (!sessions.find(s => s.id === doc.id)) {
          sessions.push({ id: doc.id, ...doc.data(), isSharedWithMe: true } as SavedSession & { isSharedWithMe?: boolean });
        }
      });
      
      // Sort combined sessions by date
      sessions.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
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

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!user || !db || !window.confirm('Are you sure you want to delete this session?')) return;
    
    setIsDeleting(sessionId);
    try {
      await deleteDoc(doc(db, 'advisor_sessions', sessionId));
      if (currentSessionId === sessionId) {
        startNewSession();
      }
      await fetchSavedSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("Failed to delete session.");
    } finally {
      setIsDeleting(null);
    }
  };

  const openShareModal = (e: React.MouseEvent, session: SavedSession) => {
    e.stopPropagation();
    setSessionToShare(session);
    setShareEmail(session.sharedWithEmail || '');
    setIsShareModalOpen(true);
  };

  const handleShareSession = async () => {
    if (!user || !db || !sessionToShare || !shareEmail.trim()) return;
    
    setIsSharing(true);
    try {
      await updateDoc(doc(db, 'advisor_sessions', sessionToShare.id), {
        sharedWithEmail: shareEmail.trim().toLowerCase()
      });
      setIsShareModalOpen(false);
      setSessionToShare(null);
      setShareEmail('');
      await fetchSavedSessions();
    } catch (err) {
      console.error("Error sharing session:", err);
      setError("Failed to share session. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async () => {
    if (!user || !db || !sessionToShare) return;
    
    setIsSharing(true);
    try {
      await updateDoc(doc(db, 'advisor_sessions', sessionToShare.id), {
        sharedWithEmail: null
      });
      setIsShareModalOpen(false);
      setSessionToShare(null);
      setShareEmail('');
      await fetchSavedSessions();
    } catch (err) {
      console.error("Error removing share:", err);
      setError("Failed to remove share. Please try again.");
    } finally {
      setIsSharing(false);
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

  const handlePrint = () => {
    window.print();
  };

  const logoUrl = settings.logoUrl || "/Copilot_NextSteps(EPS).jpg";

  const handleExportWord = async () => {
    if (!currentSessionId) return;
    
    const session = savedSessions.find(s => s.id === currentSessionId);
    const sessionName = session?.name || 'Saved Session';
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${sessionName}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .message { margin-bottom: 20px; }
          .user { color: #4f46e5; font-weight: bold; }
          .ai { color: #0f172a; font-weight: bold; }
          .content { margin-top: 5px; }
        </style>
      </head>
      <body>
    `;

    if (logoUrl) {
      htmlContent += `<img src="${logoUrl}" height="60" /><br/><br/>`;
    }

    htmlContent += `
      <h1>AI Advisor Session: ${sessionName}</h1>
      <p>Generated for ${user?.displayName} on ${new Date().toLocaleDateString()}</p>
      <hr />
    `;

    for (const msg of messages) {
      const roleName = msg.role === 'user' ? 'You' : 'AI Advisor';
      const roleClass = msg.role === 'user' ? 'user' : 'ai';
      const parsedText = await marked.parse(msg.text);
      
      htmlContent += `
        <div class="message">
          <div class="${roleClass}">${roleName}:</div>
          <div class="content">${parsedText}</div>
        </div>
      `;
    }

    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionName.replace(/\s+/g, '_')}_Session.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-6 print:h-auto print:block">
      {/* Sidebar for Saved Sessions */}
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden print:hidden",
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
              <div
                key={session.id}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-colors group relative cursor-pointer",
                  currentSessionId === session.id ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50 text-slate-700"
                )}
                onClick={() => loadSession(session)}
              >
                <MessageSquare className={cn("w-5 h-5 mt-0.5 shrink-0", currentSessionId === session.id ? "text-indigo-600" : "text-slate-400")} />
                <div className="overflow-hidden flex-1">
                  <p className="font-medium truncate pr-16">{session.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">
                      {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                    {(session as any).isSharedWithMe && (
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Shared with me</span>
                    )}
                    {session.sharedWithEmail && !(session as any).isSharedWithMe && (
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Shared</span>
                    )}
                  </div>
                </div>
                
                {/* Actions (only for owner) */}
                {!(session as any).isSharedWithMe && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent pl-4">
                    <button
                      onClick={(e) => openShareModal(e, session)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Share session"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      disabled={isDeleting === session.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative print:border-none print:shadow-none">
        
        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block mb-8 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">
              AI Advisor Session: {currentSessionId ? savedSessions.find(s => s.id === currentSessionId)?.name || 'Saved Session' : 'Current Session'}
            </h1>
            <img 
              src={logoUrl} 
              alt="Next Steps Logo" 
              className="h-[60px] w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-slate-500">Generated for {user?.displayName} on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
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
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              disabled={currentSessionId === null}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              title={currentSessionId ? "Export to Word" : "Save session first to export"}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Word</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={currentSessionId === null}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              title={currentSessionId ? "Print / Save as PDF" : "Save session first to print"}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF / Print</span>
            </button>
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
        </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 print:overflow-visible print:bg-white print:p-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-4 print:gap-2 print:mb-6", msg.role === 'user' ? "flex-row-reverse print:flex-row" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 print:hidden",
              msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            {/* Print-only labels */}
            <div className="hidden print:block font-bold text-slate-900 w-24 shrink-0">
              {msg.role === 'user' ? 'You:' : 'AI Advisor:'}
            </div>

            <div className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3 print:max-w-none print:p-0 print:rounded-none print:border-none print:bg-transparent print:text-slate-900 print:shadow-none",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-indigo-600 print:prose-slate print:prose-a:text-slate-900">
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
      <div className="p-4 border-t border-slate-200 bg-white print:hidden">
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
      {/* Share Modal */}
      {isShareModalOpen && sessionToShare && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Share Session
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                Share this session with your significant loved one so they can read the advice. They will need to sign in with this Google Account email address.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Account Email</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="loved.one@gmail.com"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleShareSession()}
                />
              </div>
              
              {sessionToShare.sharedWithEmail && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-900">Currently shared with:</p>
                    <p className="text-sm text-indigo-700">{sessionToShare.sharedWithEmail}</p>
                  </div>
                  <button
                    onClick={handleRemoveShare}
                    disabled={isSharing}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Remove Access
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareSession}
                disabled={!shareEmail.trim() || isSharing || shareEmail === sessionToShare.sharedWithEmail}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSharing ? 'Saving...' : 'Share Access'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
