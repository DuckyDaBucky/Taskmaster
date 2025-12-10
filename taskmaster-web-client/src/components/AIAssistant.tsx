/**
 * AI Assistant - Floating chat widget
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Minimize2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! I'm TaskMaster. Ask me anything about your studies!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          systemPrompt: `You are TaskMaster, a helpful study assistant for UTD students. User: ${user?.firstName || 'Student'}. Be concise and friendly.`,
        }),
      });

      const data = await response.json();
      const content = data.error 
        ? `Error: ${data.error}` 
        : (data.response || "No response received");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Connection error: ${error.message}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Closed - just the logo, no circle
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 hover:scale-110 transition-transform"
        title="Open TaskMaster AI"
      >
        <img 
          src="/favicon.png" 
          alt="TaskMaster" 
          className="w-full h-full drop-shadow-lg"
        />
      </button>
    );
  }

  // Minimized
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-lg hover:bg-secondary/50"
      >
        <img src="/favicon.png" alt="" className="w-5 h-5" />
        <span className="text-sm font-medium text-foreground">TaskMaster</span>
      </button>
    );
  }

  // Open
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[480px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="" className="w-6 h-6" />
          <span className="font-semibold text-sm">TaskMaster AI</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/20 rounded">
            <Minimize2 size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-secondary text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary px-3 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
