/**
 * AI Assistant - Floating chat widget with deep platform integration
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Minimize2, RefreshCw, Paperclip, File } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { aiContextService } from '../services/aiContextService';
import { supabase } from '../lib/supabase';
import { apiService } from '../services/api';

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
      content: "Hey! I'm TaskMaster, your personal study assistant. I can help you manage tasks, check deadlines, create flashcards, and organize your classes. What would you like to work on?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Load user context when assistant opens
  useEffect(() => {
    const loadContext = async () => {
      if (isOpen && !contextLoaded) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Loading AI context for user:', session?.user?.id);
          if (session?.user?.id) {
            const context = await aiContextService.getUserContext(session.user.id);
            console.log('Context loaded:', {
              tasks: context.tasks.length,
              classes: context.classes.length,
              stats: context.stats
            });
            const prompt = aiContextService.buildSystemPrompt(context);
            console.log('System prompt built, length:', prompt.length);
            setSystemPrompt(prompt);
            setContextLoaded(true);
          } else {
            console.warn('No active session for AI context');
          }
        } catch (error) {
          console.error('Failed to load AI context:', error);
          // Use fallback prompt
          setSystemPrompt(
            `You are TaskMaster AI, an intelligent study assistant for the TaskMaster platform at UTD. 
            Help students with their tasks, classes, calendar, flashcards, and study resources. 
            Be friendly, concise, and action-oriented.`
          );
          setContextLoaded(true);
        }
      }
    };
    loadContext();
  }, [isOpen, contextLoaded]);

  // Function to refresh context
  const refreshContext = async () => {
    setContextLoaded(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const context = await aiContextService.getUserContext(session.user.id);
        const prompt = aiContextService.buildSystemPrompt(context);
        setSystemPrompt(prompt);
        setContextLoaded(true);
        
        // Add confirmation message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Context refreshed! I now have your latest tasks, classes, and events.',
        }]);
      }
    } catch (error) {
      console.error('Failed to refresh context:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let userContent = input.trim();
    const fileToUpload = attachedFile;
    
    // If file is attached, upload it first
    if (fileToUpload) {
      setIsUploading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const resource = await apiService.smartUploadResource(fileToUpload);
          userContent += `\n\n[📎 Uploaded: ${fileToUpload.name}]`;
          
          // Add confirmation message
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ File "${fileToUpload.name}" uploaded successfully! I'll analyze it and help you with any questions about it.`,
          }]);
        }
      } catch (error: any) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Failed to upload file: ${error.message}`,
        }]);
        setIsUploading(false);
        setAttachedFile(null);
        return;
      }
      setIsUploading(false);
      setAttachedFile(null);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          systemPrompt: systemPrompt || `You are TaskMaster, a helpful study assistant for UTD students. User: ${user?.firstName || 'Student'}. Be concise and friendly.`,
          conversationHistory,
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 hover:scale-110 transition-transform bg-transparent border-0"
        title="Open TaskMaster AI"
        style={{ background: 'transparent', border: 'none' }}
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
          {contextLoaded && (
            <span className="text-xs opacity-75">● Connected</span>
          )}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={refreshContext} 
            className="p-1.5 hover:bg-white/20 rounded"
            title="Refresh my data"
          >
            <RefreshCw size={16} />
          </button>
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
      <div className="p-3 border-t border-border space-y-2">
        {/* File attachment preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg text-sm">
            <File size={16} className="text-primary" />
            <span className="flex-1 truncate text-foreground">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.md"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? "Uploading..." : "Ask anything..."}
            disabled={isUploading}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !attachedFile) || isLoading || isUploading}
            className="p-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
          >
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
