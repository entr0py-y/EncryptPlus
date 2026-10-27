"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  Send,
  Bot,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  History,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  Database
} from "lucide-react";
import {
  sendAgentMessage,
  fetchAgentTasks,
  recoverAgentTask,
  AgentTaskRecord,
  AgentChatResponse
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  recalledMemories?: string[];
  verifiedData?: any;
  links?: { title: string; url: string }[];
  isInterruptedAlert?: boolean;
}

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "encryptplus_agent_chat_history";

export function AgentDrawer({ isOpen, onClose }: AgentDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<AgentTaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Initial welcome message
        setMessages([
          {
            id: "msg_welcome",
            sender: "agent",
            text: "Hello. I am the **EncryptPlus AI Agent**, powered by Hindsight persistent memory and authoritative cryptographic analysis. I can query verified scan findings, track background scans, recover interrupted tasks, and evaluate post-quantum readiness.\n\nHow can I assist your cryptographic audit today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            links: [
              { title: "Past Audits", url: "/scans" }
            ]
          }
        ]);
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    }
  }, [messages]);

  // Load active tasks when drawer opens or tab switches
  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadTasks = async () => {
    try {
      const data = await fetchAgentTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load agent tasks:", err);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res: AgentChatResponse = await sendAgentMessage(textToSend);
      const agentMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: "agent",
        text: res.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recalledMemories: res.recalled_memories,
        verifiedData: res.verified_data,
        links: res.links
      };
      setMessages((prev) => [...prev, agentMsg]);
      await loadTasks();
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "agent",
        text: "⚠️ **Connection Error**: Unable to communicate with the AI Agent backend service. Please check that FastAPI is running on port 8000.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (taskId: string) => {
    try {
      const res = await recoverAgentTask(taskId);
      const notice: ChatMessage = {
        id: `rec_${Date.now()}`,
        sender: "agent",
        text: `🔄 **Recovery Action Dispatched**: Task \`${taskId}\` has been safely restarted. Status: \`${res.status}\`.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, notice]);
      await loadTasks();
      setActiveTab("chat");
    } catch (err: any) {
      alert("Failed to recover task: " + err.message);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "msg_reset",
        sender: "agent",
        text: "Conversation history cleared. Context from Hindsight memory bank will still be recalled on new queries.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#0c0c0e] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#121215]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-black dark:text-white tracking-tight">
                  EncryptPlus Assistant
                </h2>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-black dark:text-white">
                  Hindsight Memory
                </Badge>
              </div>
              <p className="text-[11px] text-black dark:text-white font-mono">
                Persistent Memory & Task Recovery Agent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              title="Clear Local Chat View"
              className="p-1.5 rounded-lg text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-xs"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 py-2.5 text-center transition-colors border-b-2 font-medium",
              activeTab === "chat"
                ? "border-zinc-950 dark:border-white text-black dark:text-white bg-zinc-100/50 dark:bg-zinc-900/40"
                : "border-transparent text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            )}
          >
            Chat & Insights
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "flex-1 py-2.5 text-center transition-colors border-b-2 font-medium flex items-center justify-center gap-1.5",
              activeTab === "tasks"
                ? "border-zinc-950 dark:border-white text-black dark:text-white bg-zinc-100/50 dark:bg-zinc-900/40"
                : "border-transparent text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            )}
          >
            <span>Durable Tasks</span>
            {tasks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white">
                {tasks.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        {activeTab === "chat" ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col space-y-1.5 max-w-[90%]",
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-black dark:text-white font-mono px-1">
                  <span>{m.sender === "user" ? "You" : "EncryptPlus Agent"}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                {/* Recalled Memory Badges */}
                {m.recalledMemories && m.recalledMemories.length > 0 && (
                  <div className="p-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 text-[11px] font-mono space-y-1 w-full">
                    <div className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[9px]">
                      <Sparkles className="w-3 h-3" />
                      <span>Hindsight Recalled Memory</span>
                    </div>
                    {m.recalledMemories.map((mem, idx) => (
                      <div key={idx} className="italic text-[10px] pl-2 border-l border-yellow-400/40">
                        "{mem}"
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-xs leading-relaxed select-text",
                    m.sender === "user"
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-black font-sans shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 font-sans shadow-sm"
                  )}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Verified Data Badge */}
                  {m.verifiedData && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-[10px] text-yellow-500 dark:text-yellow-400 font-mono font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Verified ECDAT Database Data</span>
                    </div>
                  )}

                  {/* Attached Links */}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-black dark:text-white font-mono font-medium">
                        Related Scans & Reports
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.links.map((link, i) => (
                          <Link
                            key={i}
                            href={link.url}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-[11px] font-mono text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <span>{link.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-black dark:text-white font-mono mr-auto animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-yellow-500 dark:text-yellow-400" />
                <span>Recalling Hindsight memories & verifying database records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Tasks Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-mono uppercase tracking-wider text-black dark:text-white">
                Persistent Task State Machine
              </span>
              <Button variant="ghost" size="sm" onClick={loadTasks} className="h-7 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-black dark:text-white">
                No agent tasks recorded yet. Ask the agent to scan a repository to create a persistent task.
              </div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.task_id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black dark:text-white">
                      {t.task_id}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-mono",
                        t.status === "completed" && "border-yellow-500 text-yellow-500 dark:text-yellow-400 bg-yellow-500/10",
                        t.status === "running" && "border-yellow-500 text-yellow-500 dark:text-yellow-400 bg-yellow-500/10",
                        t.status === "interrupted" && "border-yellow-500 text-yellow-500 dark:text-yellow-400 bg-yellow-500/10",
                        t.status === "failed" && "border-yellow-500 text-yellow-500 dark:text-yellow-400 bg-yellow-500/10"
                      )}
                    >
                      {t.status}
                    </Badge>
                  </div>

                  <div className="text-black dark:text-white truncate">
                    Target: <strong className="text-black dark:text-white">{t.target || "N/A"}</strong>
                  </div>

                  {t.result_summary && (
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] text-black dark:text-white">
                      {t.result_summary}
                    </div>
                  )}

                  {t.error_info && (
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-[11px] text-black dark:text-white flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-500" />
                      <span>{t.error_info}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="text-black dark:text-white">
                      Verification: <strong>{t.verification_state}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {t.status === "interrupted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecover(t.task_id)}
                          className="h-7 text-xs border-amber-500/50 text-yellow-500 dark:text-yellow-400 hover:bg-amber-500/10"
                        >
                          Recover Task
                        </Button>
                      )}
                      {t.report_url && (
                        <Link href={t.report_url} onClick={onClose}>
                          <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
                            <span>View Scan</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {activeTab === "chat" && (
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-black dark:text-white">
            <span className="shrink-0 text-black dark:text-white">Try:</span>
            <button
              onClick={() => handleSend("What was the result of our last OpenSSL scan?")}
              className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            >
              Last OpenSSL scan?
            </button>
            <button
              onClick={() => handleSend("Scan demo_repo")}
              className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            >
              Scan demo_repo
            </button>
            <button
              onClick={() => handleSend("Are there any interrupted tasks?")}
              className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 text-black dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400"
            >
              Check interrupted tasks
            </button>
          </div>
        )}

        {/* Input Bar */}
        {activeTab === "chat" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215]"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about scans, post-quantum readiness, or recover tasks..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-xs font-sans text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
              />
              <Button
                type="submit"
                variant="yellow"
                size="sm"
                disabled={loading || !input.trim()}
                className="h-10 px-3.5 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
