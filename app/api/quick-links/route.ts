import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_quick_links")
    .select("id, label, url, created_at")
    .eq("profile_id", session.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, url } = await req.json();
  if (!label?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Label and URL are required." }, { status: 400 });
  }

  // Simple URL sanitisation — must look like a URL
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith("/")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const { data, error } = await supabase
    .from("user_quick_links")
    .insert({ profile_id: session.id, label: label.trim(), url: cleanUrl })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
