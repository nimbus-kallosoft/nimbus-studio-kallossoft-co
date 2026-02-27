"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo } from "@/lib/types";
import { AGENT_EMOJIS } from "@/lib/types";

interface ProcessPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProcessPanel({ open, onClose }: ProcessPanelProps) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [todayCost, setTodayCost] = useState(0);
  const [agentCosts, setAgentCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/observe/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.agents) setAgents(data.agents);
        }
      } catch {
        // Dashboard fetch failed
      }
    };
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchCosts = async () => {
      try {
        const res = await fetch("/api/observe/costs");
        if (res.ok) {
          const data = await res.json();
          if (data.total !== undefined) setTodayCost(data.total);
          if (data.by_agent) setAgentCosts(data.by_agent);
        }
      } catch {
        // Cost fetch failed
      }
    };
    fetchCosts();
    const interval = setInterval(fetchCosts, 30000);
    return () => clearInterval(interval);
  }, [open]);

  const defaultAgents: AgentInfo[] =
    agents.length > 0
      ? agents
      : Object.entries(AGENT_EMOJIS).map(([name, emoji]) => ({
          name,
          emoji,
          status: "offline" as const,
        }));

  return (
    <>
      {/* Mobile bottom sheet */}
      <div className="sm:hidden">
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
              />
              <MobileSheet
                agents={defaultAgents}
                expandedAgent={expandedAgent}
                setExpandedAgent={setExpandedAgent}
                todayCost={todayCost}
                agentCosts={agentCosts}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop side panel */}
      <div className="hidden sm:block">
        <motion.div
          className="fixed top-14 right-0 bottom-0 z-30 w-[400px] border-l border-white/5 bg-[#0a0a1a]/95 backdrop-blur-xl"
          initial={{ x: 400 }}
          animate={{ x: open ? 0 : 400 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <PanelContent
            agents={defaultAgents}
            expandedAgent={expandedAgent}
            setExpandedAgent={setExpandedAgent}
            todayCost={todayCost}
            agentCosts={agentCosts}
          />
        </motion.div>
      </div>
    </>
  );
}

function MobileSheet({
  agents,
  expandedAgent,
  setExpandedAgent,
  todayCost,
  agentCosts,
}: {
  agents: AgentInfo[];
  expandedAgent: string | null;
  setExpandedAgent: (a: string | null) => void;
  todayCost: number;
  agentCosts: Record<string, number>;
}) {
  return (
    <motion.div
      className="fixed right-0 bottom-0 left-0 z-50 max-h-[80dvh] overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100) setExpandedAgent(null);
      }}
    >
      {/* Handle */}
      <div className="flex justify-center py-2">
        <div className="h-1 w-10 rounded-full bg-gray-600" />
      </div>
      <PanelContent
        agents={agents}
        expandedAgent={expandedAgent}
        setExpandedAgent={setExpandedAgent}
        todayCost={todayCost}
        agentCosts={agentCosts}
      />
    </motion.div>
  );
}

function PanelContent({
  agents,
  expandedAgent,
  setExpandedAgent,
  todayCost,
  agentCosts,
}: {
  agents: AgentInfo[];
  expandedAgent: string | null;
  setExpandedAgent: (a: string | null) => void;
  todayCost: number;
  agentCosts: Record<string, number>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-200">Agents</h2>
        <span className="text-xs text-gray-500">
          {agents.filter((a) => a.status === "active").length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 chat-scroll">
        <AnimatePresence mode="wait">
          {expandedAgent ? (
            <AgentLogView
              key={expandedAgent}
              agent={expandedAgent}
              onClose={() => setExpandedAgent(null)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {agents.map((agent) => (
                <AgentCard
                  key={agent.name}
                  agent={agent}
                  onTap={() => setExpandedAgent(agent.name)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cost ticker */}
      <div className="border-t border-white/5 px-4 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-gray-500">Today</span>
          <span className="font-mono text-sm font-medium text-gray-200">
            ${todayCost.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-1">
          {Object.entries(agentCosts).map(([name, cost]) => {
            const maxCost = Math.max(...Object.values(agentCosts), 0.01);
            const width = Math.max((cost / maxCost) * 100, 4);
            return (
              <div
                key={name}
                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 opacity-60"
                style={{ width: `${width}%` }}
                title={`${name}: $${cost.toFixed(2)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  onTap,
}: {
  agent: AgentInfo;
  onTap: () => void;
}) {
  const statusColor =
    agent.status === "active"
      ? "bg-emerald-400"
      : agent.status === "idle"
        ? "bg-gray-500"
        : "bg-gray-700";

  return (
    <motion.button
      onClick={onTap}
      className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.05]"
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-lg">{agent.emoji || AGENT_EMOJIS[agent.name] || "🤖"}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200 capitalize">
            {agent.name}
          </span>
          <div className="relative">
            <div className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
            {agent.status === "active" && (
              <div
                className={`absolute inset-0 h-1.5 w-1.5 animate-ping rounded-full ${statusColor} opacity-75`}
              />
            )}
          </div>
        </div>
        {agent.task && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
            {agent.task}
          </p>
        )}
        {(agent.cost !== undefined || agent.turns !== undefined) && (
          <p className="mt-1 text-xs text-gray-600">
            {agent.cost !== undefined && `$${agent.cost.toFixed(2)}`}
            {agent.turns !== undefined && ` · ${agent.turns} turns`}
            {agent.duration && ` · ${agent.duration}`}
          </p>
        )}
      </div>
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-gray-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </motion.button>
  );
}

function AgentLogView({
  agent,
  onClose,
}: {
  agent: string;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // First fetch existing logs
    fetch(`/api/observe/${agent}/logs`)
      .then((res) => (res.ok ? res.json() : { logs: [] }))
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .catch(() => {});

    // Then connect to SSE stream
    const es = new EventSource(`/api/observe/${agent}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    es.onerror = () => {
      // SSE connection error — will reconnect automatically
    };

    return () => {
      es.close();
    };
  }, [agent]);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const colorForLine = (line: string) => {
    if (line.includes("error") || line.includes("Error") || line.includes("FAIL"))
      return "text-red-400";
    if (line.includes("success") || line.includes("✓") || line.includes("PASS"))
      return "text-emerald-400";
    if (line.includes("warning") || line.includes("⚠"))
      return "text-yellow-400";
    if (line.includes("heartbeat") || line.includes("ping"))
      return "text-gray-600";
    return "text-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {AGENT_EMOJIS[agent] || "🤖"}
          </span>
          <span className="text-sm font-medium text-gray-200 capitalize">
            {agent}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 transition-colors hover:bg-white/5"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg bg-[#0d0d1a] p-3 font-[family-name:var(--font-jetbrains)] log-scroll">
        {logs.length === 0 && (
          <p className="text-xs text-gray-600">No logs yet...</p>
        )}
        {logs.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className={`text-xs leading-relaxed ${colorForLine(line)}`}
          >
            {line}
          </motion.div>
        ))}
        <div ref={logEndRef} />
      </div>
    </motion.div>
  );
}
