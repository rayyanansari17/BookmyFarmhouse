import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";
import bcrypt from "bcryptjs";
import { logApiRequest } from "@/lib/services/request-log.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  pages: {
    signIn: "/vendor/login",
    error: "/vendor/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Optional: pass "admin" to target the admin login
        portal: { label: "Portal", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({ email: credentials.email })
          .select("+passwordHash")
          .lean();

        if (!user) return null;

        // Only local-auth users have a password
        if (user.authProvider !== "local" || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        if (!user.isActive)
          throw new Error("Your account has been deactivated. Contact support.");
        if (user.isSuspended)
          throw new Error(`Account suspended: ${user.suspensionReason ?? "contact support"}`);

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          whatsapp: user.whatsapp,
          businessName: user.businessName,
          profileImage: user.profileImage,
          about: user.about,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: only for vendors
      if (account?.provider === "google") {
        await connectDB();

        const existingUser = await User.findOne({
          $or: [{ googleId: account.providerAccountId }, { email: user.email ?? "" }],
        });

        const u = user as unknown as Record<string, unknown>;

        if (existingUser) {
          if (!existingUser.isActive || existingUser.isSuspended) return false;

          if (!existingUser.googleId) {
            await User.findByIdAndUpdate(existingUser._id, {
              googleId: account.providerAccountId,
              authProvider: "google",
            });
          }

          u.id = existingUser._id.toString();
          u.role = existingUser.role;
          u.phone = existingUser.phone;
          u.businessName = existingUser.businessName;
          u.profileImage = existingUser.profileImage;
          u.about = existingUser.about;
        } else {
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            googleId: account.providerAccountId,
            authProvider: "google",
            role: "vendor",
            profileImage: user.image ?? undefined,
          });

          u.id = newUser._id.toString();
          u.role = "vendor";
          u.businessName = undefined;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = String(u.id ?? user.id);
        token.role = u.role as "vendor" | "admin";
        token.phone = u.phone as string | undefined;
        token.whatsapp = u.whatsapp as string | undefined;
        token.businessName = u.businessName as string | undefined;
        token.profileImage = u.profileImage as string | undefined;
        token.about = u.about as string | undefined;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "vendor" | "admin";
      session.user.phone = token.phone as string | undefined;
      session.user.whatsapp = token.whatsapp as string | undefined;
      session.user.businessName = token.businessName as string | undefined;
      session.user.profileImage = token.profileImage as string | undefined;
      session.user.about = token.about as string | undefined;
      return session;
    },
  },

  events: {
    signIn: async ({ user, account }) => {
      // Only log credential/google logins (not OAuth token refreshes)
      if (!account || !["credentials", "google"].includes(account.provider)) return;
      try {
        const u = user as unknown as Record<string, unknown>;
        await logApiRequest({
          action: "LOGIN",
          method: "POST",
          path: `/api/auth/callback/${account.provider}`,
          status: 200,
          userId: String(u.id ?? user.id ?? ""),
          userName: user.name ?? null,
          userEmail: user.email ?? null,
          userRole: (u.role as string | undefined) ?? null,
          ipAddress: null,
        });
      } catch (err) {
        console.error("[auth-event signIn]", err);
      }
    },

    signOut: async (params) => {
      const token = "token" in params ? params.token : null;
      try {
        await logApiRequest({
          action: "LOGOUT",
          method: "POST",
          path: "/api/auth/signout",
          status: 200,
          userId: (token?.sub as string | undefined) ?? null,
          userName: (token?.name as string | undefined) ?? null,
          userEmail: (token?.email as string | undefined) ?? null,
          userRole: (token?.role as string | undefined) ?? null,
          ipAddress: null,
        });
      } catch (err) {
        console.error("[auth-event signOut]", err);
      }
    },
  },
});
