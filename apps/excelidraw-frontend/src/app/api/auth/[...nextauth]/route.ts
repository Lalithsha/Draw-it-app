import NextAuth, { DefaultSession, type NextAuthOptions, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: DefaultSession["user"] & { id?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    email?: string;
    name?: string;
  }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
          name: "Login with email",
          credentials: {
            username: { label: "Username", type: "text", placeholder: "ankur@1" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            const username = credentials?.username;
            const password = credentials?.password;
            console.log("The username is : ", username, password);

            if (!username || !password) {
              return null;
            }

            try {
              const response = await axios.post(
                `http://localhost:3001/api/v1/user/signin`,
                { username, password },
                { withCredentials: true }
              );
              console.log("The response from axios is: ", response.data);
              
              if (response && response.data) {
                return {
                  id: response.data.user?.id ?? 'temp-id',
                  email: response.data.user?.email ?? username,
                  name: response.data.user?.name,
                  accessToken: response.data.token
                };

              }
              return null;
            } catch (error) {
              console.log("Error in axios request: ", error);
              return null;
            }
            
          }
        }),
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ||"" 
        })
      ],
      secret: process.env.NEXTAUTH_SECRET,
      callbacks: {
        async signIn({ user, account }: { user: User; account: { provider?: string } | null }) {
          if (account?.provider === 'google') {
            const email = encodeURIComponent(user.email || "");
            const name = encodeURIComponent(user.name || "");
            // Redirect to client bridge page so cookies are set in the browser context
            return `/auth/bridge?email=${email}&name=${name}&redirect=${encodeURIComponent("/")}`;
          }
          return true;
        },
        async jwt({ token, user }: { token: JWT; user?: User & { accessToken?: string } }) {
          // On any sign-in, merge known fields from the provider/user into the token.
          // This covers both Credentials and Google providers.
          if (user) {
            const u = user as Partial<User> & { accessToken?: string; id?: string };
            if (u.accessToken) token.accessToken = u.accessToken;
            if (u.id) token.id = u.id;
            if (u.email) token.email = u.email;
            if (u.name) token.name = u.name;
          }
          return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
          if (token.accessToken) {
            session.accessToken = token.accessToken;
          }
          const jwtToken = token as Partial<JWT> & {
            id?: string;
            email?: string;
            name?: string;
          };
          session.user = {
            ...session.user,
            id: jwtToken.id ?? session.user?.id,
            email: jwtToken.email ?? session.user?.email,
            name: jwtToken.name ?? session.user?.name,
          };
          return session;
        },
      async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
          // Land on home canvas by default after auth
          if (url.startsWith(baseUrl)) {
            return `${baseUrl}/`;
          }
          if (url.startsWith("/")) return `${baseUrl}${url}`;
          else if (new URL(url).origin === baseUrl) return url;
          return baseUrl;
        },
    },
} as const;

const handler = NextAuth(authOptions);

console.log("The google client id is : ", process.env.GOOGLE_CLIENT_ID);
console.log("The google client secret is : ", process.env.GOOGLE_CLIENT_SECRET);

export { handler as GET, handler as POST }




