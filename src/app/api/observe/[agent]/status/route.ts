import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { nimbusFetch } from "@/lib/nimbus";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agent } = await params;
  const res = await nimbusFetch(`/observe/${agent}/status`);

  if (!res.ok) {
    return NextResponse.json({ status: "offline" }, { status: 200 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
