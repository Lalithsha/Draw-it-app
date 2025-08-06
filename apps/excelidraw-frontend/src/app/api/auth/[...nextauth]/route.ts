import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

const handler = NextAuth({
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
                { username, password }
              );
              console.log("The response from axios is: ", response.data);
              
              if (response && response.data) {
                return {
                  id: "temp-id", // Ensure an id is returned
                  email: username,
                  accessToken: response.data.token // Include token if needed
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
        async jwt({ token, user }) {
          // When the user signs in, `user` contains the object returned by `authorize`
          console.log('The user token is ', token, '\n The user is: ', user);
          if (user && 'accessToken' in user) {
            console.log("The user object is: ", user);
            token.accessToken = (user as { accessToken: string }).accessToken;
          }
          return token;
        },
        async session({ session, token }) {
          // Make the accessToken available in the session object
          if (token.accessToken) {
            session.accessToken = token.accessToken;
          }
          console.log("The session object is: ", session);
          return session;
        },
      async redirect({ url, baseUrl }) {
          // If the user is signing in/up, you can redirect them to a specific page
          // For example, redirect all users to '/dashboard' after successful login/signup
          if (url.startsWith(baseUrl)) {
            return `${baseUrl}/canvas/1`; // Replace '/dashboard' with your desired page
          }
          // return '/canvas/1'; // Redirect to the canvas page after sign-in
          // Default behavior: allow relative URLs or URLs on the same origin
          if (url.startsWith("/")) return `${baseUrl}${url}`;
          else if (new URL(url).origin === baseUrl) return url;
          return baseUrl;
        },
    },
    
})

console.log("The google client id is : ", process.env.GOOGLE_CLIENT_ID);
console.log("The google client secret is : ", process.env.GOOGLE_CLIENT_SECRET);

export { handler as GET, handler as POST }




