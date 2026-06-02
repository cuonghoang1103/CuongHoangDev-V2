import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * Unified auth config — Spring Boot backend is the SOLE source of truth for users.
 *
 * Auth flow:
 *  1. Credentials: authorize() calls backend /auth/login, gets JWT + role.
 *  2. OAuth (Google/GitHub): NextAuth handles OAuth dance, then we call backend
 *     to create/find user and get their role.
 *
 * Both flows: role is fetched from backend at sign-in and cached in JWT.
 * Admin changes role → user must sign out & back in to pick up new role.
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
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          const userData = data.data;

          if (!userData?.token) return null;

          const role = normalizeRole(userData.role);

          return {
            id: String(userData.userId ?? userData.id ?? ""),
            email: userData.email ?? `${credentials.username}@local.local`,
            name: userData.username ?? credentials.username,
            username: userData.username ?? credentials.username,
            role,
            isSocialUser: false,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "USER";
        token.username = (user as any).username ?? null;
        token.isSocialUser = false;
        token.provider = "credentials";
      }

      // OAuth first sign-in: fetch role from backend
      if (account && account.provider !== "credentials" && !token.backendRoleFetched) {
        const email = token.email as string | undefined;
        const name = token.name as string | undefined;
        const provider = account.provider;

        if (email) {
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

    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) as any ?? "USER";
        session.user.username = (token.username as string | null) ?? null;
        session.user.isSocialUser = (token.isSocialUser as boolean) ?? false;
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
