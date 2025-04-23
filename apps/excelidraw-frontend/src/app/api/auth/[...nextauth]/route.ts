import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { BACKEND_URL } from "../../../../../../web/app/config";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
          name: "Login with email",
          credentials: {
            username: { label: "Username", type: "text", placeholder: "ankuar@1" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials, req) {
            const username = credentials?.username;
            const password = credentials?.password;

            // db request to check if the username and password are correct
            const response = await axios.get(`${BACKEND_URL}/signin`, {
              params: {
                username,
                password
              }
            }).catch((error) => {
              console.log("Error in axios request ", error);
              return null;
            });
            console.log("The response from axios is : ", response);

            if (response && response.data) {
              return response.data;
            }
            return null;
          }
        }),
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET 
        })
      ],
      secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }




