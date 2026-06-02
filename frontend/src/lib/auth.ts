import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth config — used ONLY for OAuth providers (Google, GitHub).
 *
 * Credentials login bypasses NextAuth entirely. Instead, the user submits
 * credentials to /api/auth/login (a custom route), which:
 * 1. Calls Spring Boot backend to validate credentials
 * 2. Stores the JWT in a backend_token httpOnly cookie
 * 3. Frontend uses that cookie for all authenticated API calls
 *
 * OAuth users flow through NextAuth, which calls /api/v1/auth/oauth/register
 * on first sign-in to create/find the user in the backend DB.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // OAuth first sign-in: fetch/create user in backend and get role
      if (account && account.provider !== "credentials" && !token.backendRoleFetched) {
        const email = token.email as string | undefined;
        const name = token.name as string | undefined;
        const provider = account.provider;

        if (email) {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";
          try {
            const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                fullName: name ?? email.split("@")[0],
                provider,
                providerId: token.sub ?? "",
              }),
            });

            if (res.ok) {
              const data = await res.json();
              token.id = String(data.data?.id ?? token.sub ?? "");
              token.role = normalizeRole(data.data?.primaryRole ?? "USER");
              token.username = data.data?.username ?? email.split("@")[0];
            } else {
              token.id = token.sub ?? "";
              token.role = guessRoleFromEmail(email);
              token.username = email.split("@")[0];
            }
          } catch {
            token.id = token.sub ?? "";
            token.role = guessRoleFromEmail(email ?? "");
            token.username = (email ?? "").split("@")[0];
          }
        }

        token.isSocialUser = true;
        token.provider = provider;
        token.backendRoleFetched = true;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) as any ?? "USER";
        session.user.username = (token.username as string | null) ?? null;
        session.user.isSocialUser = (token.isSocialUser as boolean) ?? true;
        session.user.provider = (token.provider as string | null) ?? null;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function normalizeRole(role: string | null | undefined): string {
  if (!role) return "USER";
  const r = role.toUpperCase();
  if (r === "ADMIN" || r === "ROLE_ADMIN") return "ADMIN";
  if (r === "MODERATOR" || r === "ROLE_MODERATOR") return "MODERATOR";
  if (r === "EDITOR" || r === "ROLE_EDITOR") return "EDITOR";
  return "USER";
}

function guessRoleFromEmail(email: string): string {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "USER";
}
