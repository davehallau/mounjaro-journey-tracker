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
      const { pathname } = nextUrl;
      const onAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/activate");

      if (onAuthPage) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true; // public auth pages
      }
      return loggedIn; // everything else requires a session
    },
  },
} satisfies NextAuthConfig;
