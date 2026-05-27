import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  isStreaming: false,

  setMessages: (messages) =>
    set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setSessions: (sessions) =>
    set({ sessions }),

  setCurrentSessionId: (sessionId) =>
    set({ currentSessionId: sessionId }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setStreaming: (streaming) =>
    set({ isStreaming: streaming }),

  clearMessages: () =>
    set({ messages: [], currentSessionId: null }),
}));
