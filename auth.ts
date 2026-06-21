import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      username: { label: "Username" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = z
        .object({ username: z.string().min(1), password: z.string().min(1) })
        .safeParse(credentials);
      if (!parsed.success) return null;

      const { username, password } = parsed.data;
      // Accept either the username or the email address.
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.username, username),
          eq(users.email, username.toLowerCase()),
        ),
      });
      if (!user || !user.active) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return { id: user.id, name: user.username, email: user.email };
    },
  }),
];

// Social providers are only enabled once their OAuth credentials are present.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}
if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
) {
  providers.push(MicrosoftEntraID);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Restrict social logins to emails that belong to an active account, so a
    // random Google/Microsoft user can't sign in to this private app.
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      return !!(existing && existing.active);
    },
    // Resolve and carry our own users.id so server code can scope data per user
    // (credentials returns it directly; OAuth resolves it by email).
    async jwt({ token, user }) {
      if (user) {
        if (user.email) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, user.email.toLowerCase()),
          });
          token.userId = dbUser?.id ?? (user.id as string | undefined);
        } else {
          token.userId = user.id as string | undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
});
