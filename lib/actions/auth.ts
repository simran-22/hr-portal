"use server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { createSession, deleteSession } from "@/lib/session";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const RegisterSchema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(6),
  role: z.enum(["admin","hr","manager","employee","recruiter"]).default("employee"),
});

export async function login(_: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid email or password." };
  const { email, password } = parsed.data;
  const { data: user, error } = await supabase
    .from("profiles").select("id,name,email,password,role,is_active,employees(id)").eq("email", email).single();
  if (error || !user) return { error: "No account found with that email." };
  if (!user.is_active) return { error: "Your account has been deactivated." };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { error: "Incorrect password." };
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, employeeId: (user.employees as {id:string}[])?.[0]?.id });
  redirect("/dashboard");
}

export async function register(_: unknown, formData: FormData) {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, role } = parsed.data;
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).single();
  if (existing) return { error: "An account with this email already exists." };
  const hashedPassword = await bcrypt.hash(password, 12);
  const { error } = await supabase.from("profiles").insert({ name, email, password: hashedPassword, role });
  if (error) return { error: "Failed to create account. Please try again." };
  redirect("/login?registered=1");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
