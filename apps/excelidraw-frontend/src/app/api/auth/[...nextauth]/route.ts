import NextAuth, {DefaultSession, User as NextAuthUser} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
// import { BACKEND_URL } from "../../../../../../web/app/config";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth"{
  interface User extends NextAuthUser{
    acessToken?: string;
  }
  interface Session extends DefaultSession{
    accessToken?: string;
  }

}

declare module "next-auth/jwt"{
  interface JWT extends NextAuthJWT{
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
          async authorize(credentials, req) {
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
      callbacks:{
        async jwt({token, user}){
           // When the user signs in, `user` contains the object returned by `authorize`
          if(user){
            console.log("The user object is : ", user)
            token.accessToken = user.accessToken; // Store the backend token in the JWT
          }
          return token;
        },
      async session({session, token}){
         // Make the accessToken available in the session object
        session.accessToken = token.accessToken;
        return session;
      }
    },
})

console.log("The google client id is : ", process.env.GOOGLE_CLIENT_ID);
console.log("The google client secret is : ", process.env.GOOGLE_CLIENT_SECRET);

export { handler as GET, handler as POST }




