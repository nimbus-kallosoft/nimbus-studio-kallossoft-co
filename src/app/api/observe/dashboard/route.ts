import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { nimbusFetch } from "@/lib/nimbus";
import { AGENT_EMOJIS } from "@/lib/types";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await nimbusFetch("/observe/dashboard");

    if (!res.ok) {
      return NextResponse.json(
        { agents: [], error: "Dashboard unavailable" },
        { status: 200 }
      );
    }

    const data = await res.json();

    // Transform API response to match AgentInfo shape
    const agents = (data.agents || []).map((a: Record<string, unknown>) => {
      const name = (a.agent as string) || "";
      const lastDispatch = a.last_dispatch as Record<string, unknown> | null;
      const activeDispatch = a.active_dispatch as Record<string, unknown> | null;
      return {
        name,
        emoji: AGENT_EMOJIS[name] || "🤖",
        status: a.status === "active" ? "active" : a.status === "idle" ? "idle" : "offline",
        task: activeDispatch
          ? (activeDispatch.task_preview as string)
          : lastDispatch
            ? (lastDispatch.task_preview as string)?.slice(0, 80)
            : undefined,
        cost: typeof a.cost_today === "number" ? a.cost_today : undefined,
        turns: lastDispatch?.num_turns as number | undefined,
        duration: lastDispatch?.duration_ms
          ? `${Math.round((lastDispatch.duration_ms as number) / 1000)}s`
          : undefined,
      };
    });

    return NextResponse.json({
      agents,
      total_cost_today: data.total_cost_today,
      active_count: data.active_count,
    });
  } catch {
    return NextResponse.json(
      { agents: [], error: "Failed to reach Nimbus" },
      { status: 200 }
    );
  }
}
