import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

/**
 * NextAuth config — used ONLY for OAuth providers (Google, GitHub).
 *
 * The ONLY source of truth for user ROLES is the Spring Boot backend database.
 * When the admin (cuong03dx) changes a user's role through /admin/users,
 * NextAuth's JWT token refreshes from the backend on every token expiry
 * (maxAge: 3600 = 1 hour), so role changes take effect within 1 hour.
 *
 * For credentials users: NextAuth is NOT used. Backend auth is handled by
 * /api/auth/login which sets a backend_token httpOnly cookie.
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    // Token expires in 1 hour — NextAuth calls the JWT callback again to refresh.
    // This is when we re-fetch the role from the backend DB.
    maxAge: 3600,
  },
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
      const email = token.email as string | undefined;

      // ── Fresh OAuth sign-in: account is provided ──
      if (account && account.provider !== "credentials") {
        const name = token.name as string | undefined;
        const provider = account.provider;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/oauth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              fullName: name ?? email?.split("@")[0] ?? "",
              provider,
              providerId: token.sub ?? "",
            }),
          });

          const data = await res.json();
          console.log("[nextauth] oauth/register response:", res.status, JSON.stringify(data));

          if (res.ok) {
            token.id = String(data.data?.id ?? token.sub ?? "");
            token.role = normalizeRole(data.data?.primaryRole ?? "USER");
            token.username = data.data?.username ?? email?.split("@")[0] ?? "";
            token.backendRoleVersion = data.data?.roleVersion ?? 0;
            token.backendRole = token.role; // snapshot of role at login time
            console.log("[nextauth] role set to:", token.role, "version:", token.backendRoleVersion);
          } else {
            console.error("[nextauth] OAuth register failed:", res.status);
            token.id = token.sub ?? "";
            token.role = "USER";
            token.username = email?.split("@")[0] ?? "";
            token.backendRoleVersion = 0;
            token.backendRole = "USER";
          }
        } catch (err) {
          console.error("[nextauth] OAuth backend unreachable:", err);
          token.id = token.sub ?? "";
          token.role = "USER";
          token.username = email?.split("@")[0] ?? "";
          token.backendRoleVersion = 0;
          token.backendRole = "USER";
        }

        token.isSocialUser = true;
        token.provider = provider;
        return token;
      }

      // ── Token refresh (account is null): ALWAYS re-fetch role from backend ──
      // This is the KEY mechanism for role change propagation.
      // Every hour when the JWT expires, we call the backend to get the ACTUAL role.
      if (email && token.backendRoleVersion !== undefined) {
        try {
          const res = await fetch(
            `${BACKEND_URL}/api/v1/auth/role?email=${encodeURIComponent(email)}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const data = await res.json();
            const backendRole = normalizeRole(data.data?.role ?? "USER");
            const backendVersion = data.data?.roleVersion ?? 0;

            console.log(
              `[nextauth] role refresh: stored_v=${token.backendRoleVersion}, backend_v=${backendVersion}, backend_role=${backendRole}`
            );

            // Role changed in the DB — update the JWT with new role
            if (backendVersion > (token.backendRoleVersion as number)) {
              console.log("[nextauth] role CHANGED — updating JWT. Old:", token.role, "→ New:", backendRole);
              token.role = backendRole;
            }

            token.backendRoleVersion = backendVersion;
            return token;
          }
        } catch (err) {
          console.warn("[nextauth] role refresh failed, keeping current role:", err);
        }
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
        // Expose roleVersion so client components can detect if their role changed
        (session.user as any).roleVersion = (token.backendRoleVersion as number) ?? 0;
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
