import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = req.nextUrl.searchParams.get("year") ?? new Date().getFullYear().toString();

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .eq("year", Number(year))
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, date, type } = await req.json();

  if (!name || !date || !type) {
    return NextResponse.json({ error: "Name, date, and type are required." }, { status: 400 });
  }

  const dateObj = new Date(date + "T00:00:00");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = days[dateObj.getDay()];
  const year = dateObj.getFullYear();

  const { data, error } = await supabase
    .from("holidays")
    .insert({ name, date, type, day, year })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
