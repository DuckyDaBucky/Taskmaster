"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Send, Loader2, Paperclip, X } from "lucide-react";
import { marked } from "marked";
import { askTaskmasterService } from "@/services/api/askTaskmasterService";
import type { AiConversation, AiMessage } from "@/services/types";
import { aiContextService } from "@/services/aiContextService";
import { supabase } from "@/lib/supabase";
import { apiService } from "@/services/api";

const EMPTY_PROMPT =
  "You are TaskMaster, a helpful study assistant for UTD students. Be concise, friendly, and action-oriented.";

const AskTaskmasterPage: React.FC = () => {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentResource, setAttachmentResource] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeMarkdown = (value: string) =>
    value
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "  ")
      .replace(/\r\n/g, "\n");

  const renderMarkdown = (value: string) =>
    marked.parse(normalizeMarkdown(value), { gfm: true, breaks: true });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const loadPrompt = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        const context = await aiContextService.getUserContext(data.user.id);
        const prompt = await aiContextService.buildSystemPrompt(context);
        setSystemPrompt(prompt);
        setUserId(data.user.id);
      } else {
        setSystemPrompt(EMPTY_PROMPT);
      }
    };
    loadPrompt();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      const data = await askTaskmasterService.getConversations();
      setConversations(data);
      if (data.length > 0) {
        setActiveConversation(data[0]);
      }
    };
    loadConversations();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation) {
        setMessages([]);
        return;
      }
      const data = await askTaskmasterService.getMessages(activeConversation._id);
      setMessages(data);
    };
    loadMessages();
  }, [activeConversation]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conv) =>
      (conv.title || "Untitled chat").toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const startNewConversation = async () => {
    const conv = await askTaskmasterService.createConversation("New conversation");
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv);
  };

  const ensureConversation = async () => {
    if (activeConversation) return activeConversation;
    const conv = await askTaskmasterService.createConversation("New conversation");
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv);
    return conv;
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachmentResource) || isLoading || isUploading) return;
    setIsLoading(true);

    try {
      const conversation = await ensureConversation();
      let userContent = input.trim();
      setInput("");

      if (attachmentResource) {
        userContent += `\n\n[Attached: ${attachmentResource.title || attachedFile?.name}]`;
      }

      const userMessage = await askTaskmasterService.addMessage(
        conversation._id,
        "user",
        userContent
      );
      setMessages((prev) => [...prev, userMessage]);

      if (!conversation.title || conversation.title === "New conversation") {
        const title = userContent.slice(0, 60);
        await askTaskmasterService.updateConversationTitle(conversation._id, title);
        setConversations((prev) =>
          prev.map((item) =>
            item._id === conversation._id ? { ...item, title } : item
          )
        );
      }

      const history = [...messages, userMessage]
        .slice(-10)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userContent,
          systemPrompt: systemPrompt || EMPTY_PROMPT,
          conversationHistory: history,
          userId,
          attachments: attachmentResource
            ? [{ resource_id: attachmentResource._id || attachmentResource.id, name: attachmentResource.title || attachedFile?.name }]
            : [],
        }),
      });

      const data = await response.json();
      const content = data.error
        ? `Error: ${data.error}`
        : data.response || "No response received";

      const assistantMessage = await askTaskmasterService.addMessage(
        conversation._id,
        "assistant",
        content
      );
      setMessages((prev) => [...prev, assistantMessage]);
      setConversations((prev) =>
        prev.map((item) =>
          item._id === conversation._id
            ? { ...item, updatedAt: new Date().toISOString() }
            : item
        )
      );
      setAttachmentResource(null);
      setAttachedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setAttachedFile(file);
    setIsUploading(true);
    try {
      const resource = await apiService.smartUploadResource(file, undefined, {
        skipProcessing: true,
      });
      setAttachmentResource(resource);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-48px)] flex gap-4">
      <aside className="w-72 shrink-0 border border-border rounded-lg bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <button
            onClick={startNewConversation}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            New chat
          </button>
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-4">
              No conversations yet.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="font-medium truncate">
                    {conv.title || "Untitled chat"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex-1 border border-border rounded-lg bg-card flex flex-col">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">
            {activeConversation?.title || "AskTaskmaster"}
          </div>
          <div className="text-xs text-muted-foreground">
            Ask questions, get study help, and manage tasks.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Start a conversation to see your chat history here.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <div
                    className="space-y-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:rounded-md [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:rounded"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground px-3 py-2 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-4 py-3">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
              <span className="truncate">
                {attachedFile.name} • I can create a class from this syllabus automatically.
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachedFile(null);
                  setAttachmentResource(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.pptx,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Attach a file"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip size={16} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Taskmaster anything..."
              rows={2}
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachmentResource) || isLoading || isUploading}
              className="inline-flex items-center justify-center rounded-md bg-primary p-2 text-white disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AskTaskmasterPage;
