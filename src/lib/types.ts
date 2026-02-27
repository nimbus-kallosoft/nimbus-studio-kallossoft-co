export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AgentInfo {
  name: string;
  emoji: string;
  status: "active" | "idle" | "offline";
  task?: string;
  cost?: number;
  turns?: number;
  duration?: string;
}

export const AGENT_EMOJIS: Record<string, string> = {
  frontend: "💻",
  database: "🗄️",
  infrastructure: "🚀",
  testing: "🧪",
  orchestrator: "🎯",
  api: "⚡",
  "ui-designer": "🎨",
  "cleanup-qa": "✨",
};

export interface PresenceData {
  status: "online" | "dispatching" | "offline";
  agents?: AgentInfo[];
}
