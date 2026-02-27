"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { InputBar } from "@/components/InputBar";
import { ChatBubble, TypingIndicator, AgentActivityCard } from "@/components/ChatBubble";
import { ProcessPanel } from "@/components/ProcessPanel";
import { createClient } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/types";

type ChatItem =
  | { type: "message"; message: ChatMessage }
  | { type: "activity"; agent: string; emoji: string; task: string; id: string };

export default function ChatPage() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  // Load chat history from Supabase on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadHistory = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setItems(
          data.map((msg) => ({
            type: "message" as const,
            message: msg as ChatMessage,
          }))
        );
      }
    };
    loadHistory();
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [items, loading, scrollToBottom]);

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role, content })
      .select()
      .single();

    return data as ChatMessage | null;
  };

  const sendMessage = async (text: string) => {
    // Save and display user message
    const userMsg = await saveMessage("user", text);
    if (userMsg) {
      setItems((prev) => [...prev, { type: "message", message: userMsg }]);
    } else {
      // Fallback if save fails — show anyway
      const tempMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, { type: "message", message: tempMsg }]);
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.result || data.response || data.message || "...";

        // Show agent activity if present
        if (data.agent && data.agent !== "orchestrator") {
          setItems((prev) => [
            ...prev,
            {
              type: "activity",
              agent: data.agent,
              emoji: data.emoji || "🤖",
              task: data.task || "Processing...",
              id: crypto.randomUUID(),
            },
          ]);
        }

        // Save and display assistant reply
        const assistantMsg = await saveMessage("assistant", reply);
        if (assistantMsg) {
          setItems((prev) => [
            ...prev,
            { type: "message", message: assistantMsg },
          ]);
        } else {
          const tempReply: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply,
            created_at: new Date().toISOString(),
          };
          setItems((prev) => [
            ...prev,
            { type: "message", message: tempReply },
          ]);
        }

        // Speak the response
        speakResponse(reply);
      } else {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't process that request.",
          created_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, { type: "message", message: errorMsg }]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Connection error. Please try again.",
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, { type: "message", message: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {});
        audio.onended = () => URL.revokeObjectURL(url);
      }
    } catch {
      // Voice playback failed silently
    }
  };

  const handleVoiceResult = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header
        onTogglePanel={() => setPanelOpen((p) => !p)}
        panelOpen={panelOpen}
      />

      {/* Chat area */}
      <div
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto pt-14 pb-20 chat-scroll transition-all duration-300 ${
          panelOpen ? "sm:mr-[400px]" : ""
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
          {items.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-200">
                Welcome to Nimbus Studio
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ask me anything or hold the mic to speak
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {items.map((item) => {
              if (item.type === "message") {
                return (
                  <ChatBubble
                    key={item.message.id}
                    message={item.message}
                  />
                );
              }
              return (
                <AgentActivityCard
                  key={item.id}
                  agent={item.agent}
                  emoji={item.emoji}
                  task={item.task}
                  onTap={() => setPanelOpen(true)}
                />
              );
            })}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </div>

      <InputBar
        onSend={sendMessage}
        onVoiceResult={handleVoiceResult}
        disabled={loading}
      />

      <ProcessPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
