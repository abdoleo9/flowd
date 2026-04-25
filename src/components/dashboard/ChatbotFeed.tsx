"use client";

import Link from "next/link";
import { ArrowRight, Bot, User } from "lucide-react";
import type { Conversation } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatbotFeedProps {
  conversations: Conversation[];
}

export function ChatbotFeed({ conversations }: ChatbotFeedProps) {
  const { t } = useLanguage();

  const statusConfig = {
    bot: { label: "Bot", variant: "success" as const },
    human_takeover: { label: "Handoff", variant: "danger" as const },
    open: { label: t.status.pending, variant: "warning" as const },
    resolved: { label: t.status.delivered, variant: "muted" as const },
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-semibold text-white">{t.dashboard.activeConversations}</h2>
        <Link
          href="/dashboard/chatbot"
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {t.chatbot.allConversations} <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t.chatbot.noConversations}
          </div>
        ) : (
          conversations.map((conv) => {
            const config = statusConfig[conv.status] ?? { label: conv.status, variant: "muted" as const };
            const isHandoff = conv.status === "human_takeover";
            return (
              <div key={conv.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isHandoff ? "bg-danger-muted" : "bg-accent-muted"}`}>
                  {isHandoff ? <User size={14} className="text-danger" /> : <Bot size={14} className="text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {conv.customer_name ?? "Client inconnu"}
                  </p>
                  <p className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {conv.channel === "instagram" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/logos/instagram.svg" alt="Instagram" style={{ width: 11, height: 11, objectFit: "contain", flexShrink: 0 }} />
                    )}
                    {conv.channel === "messenger" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/logos/messenger.svg" alt="Messenger" style={{ width: 11, height: 11, objectFit: "contain", flexShrink: 0 }} />
                    )}
                    {conv.channel} · {formatRelativeTime(conv.updated_at)}
                  </p>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
