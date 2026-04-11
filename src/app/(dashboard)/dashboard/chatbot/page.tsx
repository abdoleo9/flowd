"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bot, User, Send, Phone, MapPin, MessageSquare, RefreshCw, ArrowLeft } from "lucide-react";
import type { Conversation, Message } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { getWilayaName } from "@/constants/wilayas";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const statusConfig = {
  bot: { label: "Bot", variant: "success" as const },
  human_takeover: { label: "Handoff", variant: "danger" as const },
  open: { label: "Ouvert", variant: "warning" as const },
  resolved: { label: "Résolu", variant: "muted" as const },
};

const channelConfig = {
  messenger: { label: "Messenger", color: "text-blue-400" },
  instagram: { label: "Instagram", color: "text-purple" },
  web: { label: "Web", color: "text-accent" },
  manual: { label: "Manuel", color: "text-muted-foreground" },
};

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "bot" | "human_takeover">("all");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const fetchConversations = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoadingConvs(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", activeWorkspace.id)
      .order("updated_at", { ascending: false });
    setConversations(data ?? []);
    setLoadingConvs(false);
  }, [supabase, activeWorkspace]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [supabase]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv.id);
  }, [activeConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv, supabase]);

  async function sendMessage() {
    if (!input.trim() || !activeConv || streaming) return;
    const content = input.trim();
    setInput("");
    setStreaming(true);
    setStreamingText("");

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConv.id, content }),
    });

    if (!res.ok || !res.body) {
      toast.error("Erreur lors de l'envoi");
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      text += chunk;
      setStreamingText(text);
    }

    setStreamingText("");
    setStreaming(false);
    fetchMessages(activeConv.id);
  }

  async function takeover() {
    if (!activeConv) return;
    await supabase
      .from("conversations")
      .update({ status: "human_takeover" })
      .eq("id", activeConv.id);
    setActiveConv((prev) => prev ? { ...prev, status: "human_takeover" } : prev);
    toast.success("Vous avez pris le contrôle de la conversation");
    fetchConversations();
  }

  const filtered = conversations
    .filter((c) => {
      if (filter === "bot") return c.status === "bot";
      if (filter === "human_takeover") return c.status === "human_takeover";
      return true;
    })
    .filter((c) => {
      if (!search) return true;
      return (c.customer_name ?? "").toLowerCase().includes(search.toLowerCase());
    });

  // Sort: handoff first
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "human_takeover" && b.status !== "human_takeover") return -1;
    if (b.status === "human_takeover" && a.status !== "human_takeover") return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // On mobile: show list when no active conv, show chat when one is selected
  const showList = !activeConv;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] -m-3 md:-m-6 bg-background">
      {/* Left: Conversation list */}
      <div className={`${showList ? "flex" : "hidden"} md:flex w-full md:w-72 flex-shrink-0 border-r border-border flex-col bg-sidebar`}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Conversations</h2>
            <button onClick={fetchConversations} className="text-muted-foreground hover:text-white">
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-muted outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "human_takeover", "bot"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter === f ? "bg-accent text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {f === "all" ? "Tous" : f === "human_takeover" ? "Handoff" : "Bot"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-center text-muted-foreground text-xs">Chargement…</div>
          ) : sorted.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs">Aucune conversation</div>
          ) : (
            sorted.map((conv) => {
              const isHandoff = conv.status === "human_takeover";
              const active = activeConv?.id === conv.id;
              const sc = statusConfig[conv.status] ?? { label: conv.status, variant: "muted" as const };
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                    active ? "bg-accent-muted" : "hover:bg-white/5"
                  } ${isHandoff ? "border-l-2 border-l-danger" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.customer_name ?? "Client inconnu"}
                      </p>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {formatRelativeTime(conv.updated_at)}
                      </p>
                    </div>
                    <Badge variant={sc.variant} className="flex-shrink-0">{sc.label}</Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Chat window */}
      <div className={`${showList ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-3 md:px-5 py-3.5 border-b border-border flex items-center gap-3 justify-between bg-card">
              {/* Back button — mobile only */}
              <button
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white flex-shrink-0"
                onClick={() => setActiveConv(null)}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{activeConv.customer_name ?? "Client"}</p>
                <p className="text-xs text-muted-foreground">
                  {channelConfig[activeConv.channel]?.label} · {activeConv.language_detected}
                  {activeConv.wilaya_code ? ` · ${getWilayaName(activeConv.wilaya_code)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeConv.status !== "human_takeover" && (
                  <button
                    onClick={takeover}
                    className="text-xs px-3 py-1.5 rounded-lg border border-orange/30 text-orange bg-orange-muted hover:bg-orange/20 transition-colors"
                  >
                    Prendre le contrôle
                  </button>
                )}
                {activeConv.status === "human_takeover" && (
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-danger-muted text-danger border border-danger/20">
                    Handoff actif
                  </span>
                )}
              </div>
            </div>

            {/* Handoff banner */}
            {activeConv.status === "human_takeover" && (
              <div className="px-5 py-2.5 bg-orange-muted border-b border-orange/20 flex items-center gap-2">
                <User size={14} className="text-orange" />
                <p className="text-xs text-orange font-medium">
                  Un agent humain a pris le contrôle de cette conversation
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && !streaming && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Aucun message
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1 bg-accent-muted">
                      <Bot size={13} className="text-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-purple-muted text-white rounded-br-sm"
                        : msg.role === "assistant"
                        ? "bg-card border border-border text-white rounded-bl-sm"
                        : "bg-white/5 text-muted-foreground italic text-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 mt-1 bg-purple-muted">
                      <User size={13} className="text-purple" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming response */}
              {streaming && streamingText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1 bg-accent-muted">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-card border border-border text-white">
                    {streamingText}
                    <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}
              {streaming && !streamingText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent-muted flex items-center justify-center mr-2">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Répondre… (Entrée pour envoyer)"
                  rows={2}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Customer info panel — hidden on mobile */}
      <div className="hidden lg:flex w-64 flex-shrink-0 border-l border-border bg-sidebar flex-col">
        {activeConv ? (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Info client
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                {(activeConv.customer_name ?? "?")[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{activeConv.customer_name ?? "Inconnu"}</p>
                <Badge variant={statusConfig[activeConv.status]?.variant ?? "muted"}>
                  {statusConfig[activeConv.status]?.label ?? activeConv.status}
                </Badge>
              </div>
            </div>

            {activeConv.customer_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={13} className="flex-shrink-0" />
                <span>{activeConv.customer_phone}</span>
              </div>
            )}

            {activeConv.wilaya_code && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={13} className="flex-shrink-0" />
                <span>{getWilayaName(activeConv.wilaya_code)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Canal</span>
                <span className="text-white capitalize">{activeConv.channel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Langue</span>
                <span className="text-white">{activeConv.language_detected}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions rapides
              </p>
              <button className="w-full text-left text-xs px-3 py-2 rounded-lg bg-accent-muted text-accent hover:bg-accent/20 transition-colors">
                Créer une commande
              </button>
              <button
                onClick={takeover}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-orange-muted text-orange hover:bg-orange/20 transition-colors"
              >
                Prendre le contrôle
              </button>
              <button
                onClick={async () => {
                  await supabase.from("conversations").update({ status: "resolved" }).eq("id", activeConv.id);
                  toast.success("Conversation résolue");
                  fetchConversations();
                  setActiveConv(null);
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-success-muted text-success hover:bg-success/20 transition-colors"
              >
                Marquer comme résolu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-xs text-muted-foreground text-center">
              Sélectionnez une conversation pour voir les détails
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
