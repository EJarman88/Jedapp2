"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "@/lib/auth/form-state";

const PIN_PATTERN = /^\d{6}$/;

function friendlyAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "That email or PIN didn't match. Try again.";
  }
  return message;
}

async function roleHomeRoute(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "restricted_reports" ? "/reports" : "/home";
}

export async function signIn(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and PIN." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: friendlyAuthError(error?.message ?? "Sign in failed.") };
  }

  redirect(await roleHomeRoute(supabase, data.user.id));
}

export async function signUp(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password || !displayName) {
    return { error: "Fill in your name, email, and PIN." };
  }
  if (!PIN_PATTERN.test(password)) {
    return { error: "PIN needs to be exactly 6 digits." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  if (!data.session || !data.user) {
    return {
      info: "Check your email to confirm your account, then log in.",
    };
  }

  redirect(await roleHomeRoute(supabase, data.user.id));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
