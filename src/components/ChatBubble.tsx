"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
          isUser
            ? "rounded-2xl rounded-br-sm bg-indigo-600/80 text-white"
            : "rounded-2xl rounded-bl-sm border border-indigo-500/20 bg-white/5 text-gray-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex gap-1.5 rounded-2xl rounded-bl-sm border border-indigo-500/20 bg-white/5 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface AgentActivityCardProps {
  agent: string;
  emoji: string;
  task: string;
  onTap?: () => void;
}

export function AgentActivityCard({
  agent,
  emoji,
  task,
  onTap,
}: AgentActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto w-fit cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
      onClick={onTap}
    >
      <p className="text-xs text-gray-400">
        <span className="mr-1">{emoji}</span>
        <span className="font-medium text-gray-300">{agent}</span> — {task}
      </p>
    </motion.div>
  );
}
