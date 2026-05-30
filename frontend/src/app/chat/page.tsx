'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSession } from 'next-auth/react';
import { Send, Trash2, Plus, MessageSquare, Sparkles, BookOpen, Code2, User, Bot, Loader2, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatMessage {
  id: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  createdAt: string;
}

interface ChatSession {
  id: number;
  sessionId: string;
  userId?: number;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ChatPage() {
  const { isAuthenticated: isBackendAuth, token } = useAuthStore();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAuthenticated = mounted && (isBackendAuth || status === 'authenticated');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/ai/chat/sessions');
      setSessions(res.data?.data || []);
    } catch (err) {
      console.warn('Chat sessions fetch failed:', err);
      setApiError('Unable to connect to AI. Check if backend is running on port 8082.');
    }
  }, []);

  const fetchHistory = useCallback(async (sessionId: string) => {
    try {
      const res = await api.get(`/api/v1/ai/chat/history/${sessionId}`);
      setMessages(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const startNewSession = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setNewMessage('');
    fetchSessions();
  };

  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await fetchHistory(sessionId);
    setShowSidebar(false);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !newMessage.trim()) || isLoading || isStreaming) return;

    const text = (input || newMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sessionId: currentSessionId || '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setNewMessage('');
    setIsStreaming(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          sessionId: currentSessionId,
          topK: 5,
        }),
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantContent = '';
      let sessionId = currentSessionId || '';
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const data = JSON.parse(raw);

            // Session ID event
            if (data.sessionId && !sessionId) {
              sessionId = data.sessionId;
              if (currentSessionId !== sessionId) setCurrentSessionId(sessionId);
              continue;
            }

            // Done event
            if (data.done) {
              if (currentSessionId !== sessionId) {
                setCurrentSessionId(sessionId);
                fetchSessions();
              }
              continue;
            }

            // Error event
            if (data.error) {
              toast.error('Server error: ' + data.error);
              continue;
            }

            // Content chunk
            if (data.content) {
              assistantContent += data.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: assistantContent, sessionId } : m
                )
              );
            }
          } catch {
            // Plain text chunk (fallback)
            if (raw) {
              assistantContent += raw;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: assistantContent, sessionId } : m
                )
              );
            }
          }
        }
      }

      if (currentSessionId !== sessionId) {
        setCurrentSessionId(sessionId);
        fetchSessions();
      }
    } catch (err) {
      toast.error('AI connection error. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== (Date.now() + 1)));
    } finally {
      setIsStreaming(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/v1/ai/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
      toast.success('Conversation deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    { label: 'About CuongHoang', icon: <User className="w-4 h-4" />, prompt: 'Tell me about CuongHoang - a full-stack developer' },
    { label: 'Skills & Tech', icon: <Code2 className="w-4 h-4" />, prompt: 'What skills and technologies does CuongHoang have?' },
    { label: 'Projects Done', icon: <Sparkles className="w-4 h-4" />, prompt: 'What projects has CuongHoang worked on?' },
    { label: 'Recent Blogs', icon: <BookOpen className="w-4 h-4" />, prompt: 'What are the recent blog posts by CuongHoang about?' },
  ];

  return (
    <div className="flex h-screen bg-darkbg pt-16">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} flex-shrink-0 border-r border-darkborder bg-darkcard transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-darkborder flex items-center justify-between">
          <h2 className={`font-heading font-bold text-text-primary transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            Conversations
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isSidebarOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <button
          onClick={startNewSession}
          className="mx-4 mt-4 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>

        <div className="flex-1 overflow-y-auto mt-2 px-2">
          {sessions.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8 px-2">
              No conversations yet
            </p>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectSession(session.sessionId)}
              className={`w-full text-left px-3 py-3 rounded-xl mb-1 group transition-colors relative ${
                currentSessionId === session.sessionId
                  ? 'bg-neon-violet/15 text-text-primary'
                  : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title || 'New conversation'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {format(new Date(session.createdAt), 'dd/MM/yyyy, HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => deleteSession(session.sessionId, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-darkborder flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors md:hidden"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isSidebarOpen ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-text-primary">AI Assistant</h1>
              <p className="text-xs text-text-muted">Powered by RAG • {isAuthenticated ? 'Logged in' : 'Guest mode'}</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-neon-indigo/20 via-neon-violet/20 to-neon-fuchsia/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-neon-violet" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
                Hello! I am AI Assistant
              </h2>
              <p className="text-text-secondary mb-8 max-w-md">
                I can answer questions about CuongHoang's portfolio, skills, projects and blog. Feel free to ask anything!
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setInput(q.prompt);
                      setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        sendMessage(fakeEvent);
                      }, 100);
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-darkcard border border-darkborder rounded-xl hover:border-neon-violet/30 hover:bg-darkcard/80 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neon-violet/10 flex items-center justify-center text-neon-violet group-hover:bg-neon-violet/20 transition-colors">
                      {q.icon}
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                      {q.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-neon-indigo to-neon-violet'
                  : 'bg-darkcard border border-darkborder'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-neon-violet" />
                )}
              </div>
              <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white rounded-tr-md'
                    : 'bg-darkcard border border-darkborder text-text-primary rounded-tl-md'
                }`}>
                  {msg.content}
                  {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.role === 'assistant' && (
                    <span className="inline-block w-2 h-4 ml-1 bg-neon-violet animate-pulse rounded" />
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1 px-1">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-darkcard border border-darkborder flex items-center justify-center">
                <Bot className="w-4 h-4 text-neon-violet" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-darkcard border border-darkborder rounded-2xl rounded-tl-md">
                <Loader2 className="w-4 h-4 text-neon-violet animate-spin" />
                <span className="text-sm text-text-muted">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-darkborder">
          <form onSubmit={sendMessage} className="flex gap-3 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about portfolio, skills, projects..."
              rows={1}
              className="flex-1 px-4 py-3 bg-darkcard border border-darkborder rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 resize-none transition-colors"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isStreaming}
              className="px-5 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2 font-medium"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-xs text-text-muted text-center mt-2">
            AI may be incorrect. Verify important information.
          </p>
        </div>
      </main>
    </div>
  );
}
