"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HeaderProps {
  onTogglePanel: () => void;
  panelOpen: boolean;
}

export function Header({ onTogglePanel, panelOpen }: HeaderProps) {
  const [status, setStatus] = useState<"online" | "dispatching" | "offline">(
    "offline"
  );

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/agents/presence");
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status ?? "online");
        } else {
          setStatus("offline");
        }
      } catch {
        setStatus("offline");
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    status === "online"
      ? "bg-emerald-400"
      : status === "dispatching"
        ? "bg-orange-400"
        : "bg-gray-500";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-white/5 bg-[#050510]/90 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        {/* Nimbus avatar */}
        <motion.div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500"
          animate={
            status === "dispatching"
              ? { scale: [1, 1.15, 1] }
              : { scale: 1 }
          }
          transition={
            status === "dispatching"
              ? { duration: 1.5, repeat: Infinity }
              : {}
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </motion.div>

        <span className="text-sm font-semibold text-gray-100">Nimbus</span>

        {/* Status dot */}
        <div className="relative">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          {status === "online" && (
            <div
              className={`absolute inset-0 h-2 w-2 animate-ping rounded-full ${statusColor} opacity-75`}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Process panel toggle */}
        <button
          onClick={onTogglePanel}
          className="rounded-lg p-2 transition-colors hover:bg-white/5"
          aria-label="Toggle process panel"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition-colors ${panelOpen ? "text-violet-400" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {panelOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
              />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
