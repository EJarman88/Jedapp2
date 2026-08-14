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

  if (profile?.role === "restricted_reports") return "/reports";
  if (profile?.role === "admin") return "/settings";
  return "/home";
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
  const requestedRole = String(formData.get("requested_role") ?? "");
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();

  if (!email || !password || !displayName) {
    return { error: "Fill in your name, email, and PIN." };
  }
  if (!PIN_PATTERN.test(password)) {
    return { error: "PIN needs to be exactly 6 digits." };
  }
  if (requestedRole !== "student" && requestedRole !== "restricted_reports") {
    return { error: "Choose an account type." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        requested_role: requestedRole,
        date_of_birth: dateOfBirth || null,
      },
    },
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
