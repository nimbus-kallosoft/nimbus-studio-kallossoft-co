import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { nimbusFetch } from "@/lib/nimbus";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await nimbusFetch("/observe/costs");

  if (!res.ok) {
    return NextResponse.json({ total: 0, by_agent: {} }, { status: 200 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
