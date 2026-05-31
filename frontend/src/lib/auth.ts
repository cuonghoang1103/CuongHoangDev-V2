import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";
// Types are extended in src/types/next-auth.d.ts

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter — credentials users are managed by Spring Boot backend.
  // Social login users are stored in JWT only (no DB dependency).
  // Session persists in browser cookie via JWT strategy.

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    // Credentials provider — delegates to Spring Boot backend
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const res = await authApi.login({
            username: credentials.username as string,
            password: credentials.password as string,
          });
          const user = res.data.data;

          if (user?.token) {
            const roles: string[] = user.roles || (user.role ? [user.role] : []);
            const backendRole = roles.some(
              (r: string) =>
                (r || "").replace("ROLE_", "").toUpperCase() === "ADMIN"
            )
              ? "ADMIN"
              : "USER";

            return {
              id: String(user.userId),
              name: user.username,
              email: user.email,
              username: user.username,
              role: backendRole,
              isSocialUser: false,
            };
          }
        } catch {
          return null;
        }
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as any).role || "USER";
        token.username = (user as any).username;
        // Social users (non-credentials) are identified by their OAuth provider
        token.isSocialUser = account?.provider !== "credentials";
        token.provider = account?.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = token.role as "ADMIN" | "ADMIN" | "MODERATOR" | "EDITOR" | "USER";
        session.user.username = token.username as string | null;
        session.user.isSocialUser = token.isSocialUser as boolean;
        session.user.provider = token.provider as string | null;
      }
      return session;
    },
  },
});
