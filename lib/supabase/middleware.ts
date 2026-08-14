import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request. This is what keeps a
 * signed-in user's auth token valid across Server Component renders — without it,
 * sessions would silently expire. Route-level role/grant checks live in each route
 * group's layout, not here.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Revalidates the token against the Supabase Auth server (unlike getSession(),
  // which only reads the local cookie) so an expired/tampered session is caught here.
  await supabase.auth.getUser();

  return response;
}
