import { create } from 'zustand';
import type { ChatMessage, ChatContext } from '../shared/types/chat.types';

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  context: ChatContext | null;
  addMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  setTyping: (isTyping: boolean) => void;
  clearHistory: () => void;
  setContext: (context: ChatContext) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Healthcare Assistant. I can help you navigate the platform, find patients, analyze data, and understand Second Brain insights. What can I help you with today?",
      timestamp: new Date(),
    },
  ],
  isOpen: false,
  isTyping: false,
  context: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  setTyping: (isTyping) => set({ isTyping }),
  clearHistory: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! How can I assist you today?",
          timestamp: new Date(),
        },
      ],
    }),
  setContext: (context) => set({ context }),
}));
