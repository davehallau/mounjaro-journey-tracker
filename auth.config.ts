import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no DB / Node-only imports). Used by middleware and extended
// in auth.ts with the Credentials provider that touches the database.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const onLogin = nextUrl.pathname.startsWith("/login");

      if (onLogin) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true; // allow access to the login page
      }
      return loggedIn; // everything else requires a session
    },
  },
} satisfies NextAuthConfig;
