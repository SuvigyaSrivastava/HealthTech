import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { chatService } from '../services/chatService';
import type { ChatContext } from '../../../shared/types/chat.types';
import { cn, formatRelative } from '../../../shared/utils/formatters';

const GRAD: React.CSSProperties = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' };

function renderContent(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
  );
}

function MessageBubble({ message }: { message: { id: string; role: string; content: string; timestamp: Date } }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
        style={isUser ? GRAD : { backgroundColor: '#EEF0FD' }}
      >
        {isUser
          ? <User size={12} className="text-white" />
          : <Bot size={12} style={{ color: '#524CDE' }} />}
      </div>
      <div
        className={cn('max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm', isUser ? 'rounded-tr-sm text-white' : 'rounded-tl-sm text-gray-800 bg-gray-50')}
        style={isUser ? GRAD : undefined}
      >
        <div className="whitespace-pre-line leading-relaxed">
          {message.content.split('\n').map((line, i) => <div key={i}>{renderContent(line)}</div>)}
        </div>
        <p className={cn('text-xs mt-1 opacity-50', isUser ? 'text-right' : 'text-left')}>{formatRelative(message.timestamp)}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF0FD' }}>
        <Bot size={12} style={{ color: '#524CDE' }} />
      </div>
      <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#524CDE', animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#524CDE', animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#AD6FD8', animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

const SUGGESTIONS = ['Show high-risk patients', 'Go to analytics', 'How many patients have diabetes?'];

export default function ChatWidget() {
  const navigate = useNavigate();
  const { messages, isOpen, isTyping, addMessage, toggleChat, setTyping, clearHistory } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const handleSend = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || isTyping) return;
    addMessage({ id: crypto.randomUUID(), role: 'user', content: msg, timestamp: new Date() });
    setInput('');
    setTyping(true);
    const context: ChatContext = { currentPage: window.location.pathname, selectedPatient: null, recentQueries: [], sessionData: {} };
    try {
      const response = await chatService.sendMessage(msg, context);
      addMessage(response);
      if (response.metadata?.action?.type === 'navigate') {
        const to = (response.metadata.action.payload as { to: string }).to;
        setTimeout(() => navigate(to), 500);
      }
    } finally { setTyping(false); }
  }, [isTyping, addMessage, setTyping, navigate]);

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all z-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        style={isOpen ? { backgroundColor: '#524CDE' } : GRAD}
        aria-label="Toggle assistant"
      >
        {isOpen ? <X size={18} className="text-white" /> : <MessageCircle size={18} className="text-white" />}
        {!isOpen && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold min-w-[18px] min-h-[18px]">
            {messages.length - 1}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-22 right-6 bg-white rounded-2xl shadow-xl flex flex-col z-50 overflow-hidden border border-gray-100"
          style={{ width: 368, height: 530, bottom: '5.5rem' }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 flex items-center gap-3" style={GRAD}>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">AI Assistant</p>
              <p className="text-white/60 text-xs">Ask about patients or navigate</p>
            </div>
            <button onClick={clearHistory} className="p-1.5 text-white/60 hover:text-white transition-colors" title="Clear history">
              <Trash2 size={13} />
            </button>
            <button onClick={toggleChat} className="p-1.5 text-white/60 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ backgroundColor: '#F8F9FC' }}>
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 py-2.5 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:text-white hover:shadow-sm"
                    style={{ borderColor: '#524CDE', color: '#524CDE' }}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, GRAD)}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3.5 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                placeholder="Ask anything..."
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all"
                style={{ '--tw-ring-color': '#524CDE' } as React.CSSProperties}
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                style={GRAD}
              >
                {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
