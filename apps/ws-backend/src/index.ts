import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {prismaClient} from "@repo/db/client"
import dotenv from "dotenv";
import path from "path";

const wss = new WebSocketServer({ port: 8081 });

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const envPath = path.resolve(__dirname, "../../../.env");
console.log(envPath)

interface User{
  ws:WebSocket,
  rooms:string[],
  userId:string
}

const users: User[] =[]

/* function checkUser(token:string):string|null{
  
  try{
    // console.log("From check user",  process.env.JWT_SECRET)
    // @ts-ignore
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, lal32i);
    console.log("Decoded token: ", decoded)
    if(typeof decoded == "string"){
      return null;
    }
    
    if(!decoded || !decoded.userId){
      return null;
    }
    console.log("Decoded userId: ", decoded.userId)
    return decoded.userId;

  } catch(error){
    return null;
  }  
} */

  function checkUser(token: string): string | null {
    try {
      // const decoded = jwt.verify(token, "lal32i") as JwtPayload;
      const decoded = jwt.verify(token, "lal32i");
      console.log("Decoded token: ", decoded);
      console.log(typeof decoded);
      // if (typeof decoded === "string") {
      //   return null;
      // }
  
      // if (!decoded || !decoded.userId) {
      //   return null;
      // }
      console.log("Decoded userId: ", decoded)
      return decoded as string;
    } catch(e) {
      return null;
    }
    // return null;
  }

wss.on('connection', function connection(ws, request) {
  ws.on('error', console.error);

  const url = request.url;
  if(!url){
    ws.close();
    return;
  }
  
  const queryParms = new URLSearchParams(url?.split('?')[1]);
  console.log("From ws backend the jwt secret is: ", process.env.JWT_SECRET)
  const token = queryParms.get("token") || "";
  const userId = checkUser(token);
  console.log("From ws backend the token is: ", token)
  console.log("From ws backend the userId is: ", userId)
  console.log("User connected: ", userId)
  if(userId==null){
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms:[],
    ws,
    
  })
  

  ws.on('message', async function message(data) {

    // const parsedData = JSON.parse(data.toString()); // {type:"join-room", roomId:1}
    const parsedData = JSON.parse(data as unknown as string); // {type: "join-room", roomId: 1}
    console.log("Parsed data: ", parsedData)

    if(parsedData.type === "join_room"){
      console.log("From join room ws is: ",  ws)
      // check here does this already room exists
      const user =  users.find(x=>x.ws===ws);
      user?.rooms.push(parsedData.roomId);
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x=>x.ws===ws);
      if(!user){
        return;
      }
      
      user.rooms = user.rooms.filter(x=>x===parsedData.room);
    }
    
    if(parsedData.type==="chat"){
      const {roomId, message} = parsedData;

      await prismaClient.chat.create({
        data:{
          roomId,
          message,
          userId
        }
      })

      users.forEach(user=>{
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type:"chat",
            message,
            roomId
          }))
        }
      })
      
    }

    
  });

  // ws.send('something');
});