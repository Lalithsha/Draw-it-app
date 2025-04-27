import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
// import { BACKEND_URL } from "../../../../../../web/app/config";

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
            
            /* 
            params: {
                username,
                password
              }
                 */
            
            // db request to check if the username and password are correct
            /* const response = await axios.post(`http://localhost:3001/api/v1/user/signin`, {
              params: {
                username,
                password
              }
            }).catch((error) => {
              console.log("Error in axios request ", error);
              return null;
            });
            console.log("The response from axios is : ", response); */


            // const response = await axios.post(
            //   `http://localhost:3001/api/v1/user/signin`,
            //   { username, password },
            //   { headers: { "Content-Type": "application/json" } }
            // ).catch((error) => {
            //   console.log("Error in axios request ", error);
            //   return null;
            // });
            // console.log("The response from axios is : ", response);
            

            // if (response && response.data) {
            //   return response.data;
            // }
            // return null;


            try {
              const response = await axios.post(
                `http://localhost:3001/api/v1/user/signin`,
                { username, password },
                { headers: { "Content-Type": "application/json" } }
              );
              console.log("The response from axios is: ", response.data);
    
              if (response && response.data) {
                return {
                  id: response.data.id || "temp-id", // Ensure an id is returned
                  email: username,
                  token: response.data.token // Include token if needed
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
      secret: process.env.NEXTAUTH_SECRET
})

console.log("The google client id is : ", process.env.GOOGLE_CLIENT_ID);
console.log("The google client secret is : ", process.env.GOOGLE_CLIENT_SECRET);

export { handler as GET, handler as POST }




