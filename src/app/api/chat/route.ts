import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { nimbusFetch } from "@/lib/nimbus";

export const maxDuration = 60;

function extractReply(output: string): string {
  // Try to extract TextPart content from stream output
  const textPartMatch = output.match(/TextPart\(\s*type='text',\s*text="([^"]*)"/);
  if (textPartMatch) return textPartMatch[1];
  // Try simpler patterns
  const lines = output.split("\n");
  const textLines = lines.filter(
    (l) =>
      l.trim() &&
      !l.startsWith("TurnBegin") &&
      !l.startsWith("StepBegin") &&
      !l.startsWith("ThinkPart") &&
      !l.startsWith("ToolCall") &&
      !l.startsWith("ToolResult") &&
      !l.startsWith("StatusUpdate") &&
      !l.startsWith("TurnEnd")
  );
  return textLines.join("\n").trim() || output.slice(0, 500);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();

  try {
    const res = await nimbusFetch("/agents/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: "orchestrator",
        task: message,
        async_mode: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Nimbus dispatch failed", detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = extractReply(data.output || "");

    return NextResponse.json({
      result: reply,
      agent: data.agent,
      status: data.status,
      cost: data.cost,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Nimbus", detail: String(err) },
      { status: 502 }
    );
  }
}
