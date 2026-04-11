"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

export function useRealtimeMessages(conversationId: string | null, initial: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  return { messages, setMessages };
}
