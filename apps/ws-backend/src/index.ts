import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {prismaClient} from "@repo/db/client"
import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const wss = new WebSocketServer({ port: 8081 });

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const envPath = path.resolve(__dirname, "../../../.env");
console.log(envPath)

// Define structure for messages awaiting ACK
interface PendingAckMessage {
  message: string; // The original stringified message
  timestamp: number;
  retries: number;
}

interface User{
  ws:WebSocket,
  rooms:string[],
  userId:string,
  pendingAcks: Map<string, PendingAckMessage>; // Map messageId to message details
}

const users: User[] =[]
const ACK_TIMEOUT = 5000; // 5 seconds timeout for acknowledgments
const MAX_RETRIES = 3; // Maximum number of times to resend a message

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
}

// Function to send a message and expect an acknowledgment
function sendWithAck(user: User, messageData: any) {
  const messageId = uuidv4();
  const messageToSend = JSON.stringify({
    ...messageData,
    messageId, // Add messageId to the payload
  });

  user.pendingAcks.set(messageId, {
    message: messageToSend,
    timestamp: Date.now(),
    retries: 0,
  });

  console.log(`Sending message ${messageId} to user ${user.userId}`);
  user.ws.send(messageToSend);
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
    pendingAcks: new Map(), // Initialize pendingAcks map
  })
  

  ws.on('message', async function message(data) {

    const parsedData = JSON.parse(data.toString()); // {type:"join-room", roomId:1}
    // const parsedData = JSON.parse(data as unknown as string); // {type: "join-room", roomId: 1}
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
          roomId: Number(roomId),
          message,
          userId
        }
      })

      users.forEach(user=>{
        if(user.rooms.includes(roomId)){
          // Use sendWithAck instead of ws.send directly
          sendWithAck(user, {
            type:"chat",
            message,
            roomId
          });
        }
      })
      
    }

    if (parsedData.type === "ack") {
      const { messageId } = parsedData;
      const user = users.find(u => u.ws === ws);
      if (user && messageId) {
        if (user.pendingAcks.delete(messageId)) {
          console.log(`Received ACK for message ${messageId} from user ${user.userId}`);
        } else {
          console.log(`Received unknown/duplicate ACK for message ${messageId} from user ${user.userId}`);
        }
      }
    }
    
  });

  // ws.send('something');
});

// Periodically check for timed-out messages
setInterval(() => {
  const now = Date.now();
  users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) { // Only process active connections
      user.pendingAcks.forEach((pendingMessage, messageId) => {
        if (now - pendingMessage.timestamp > ACK_TIMEOUT) {
          console.log("Current pending retries are: ",  pendingMessage.retries)
          if (pendingMessage.retries < MAX_RETRIES) {
            // Resend the message
            pendingMessage.retries++;
            pendingMessage.timestamp = now; // Update timestamp for next timeout check
            user.ws.send(pendingMessage.message);
            console.log(`Resending message ${messageId} to user ${user.userId} (Attempt ${pendingMessage.retries})`);
          } else {
            // Max retries reached, give up
            user.pendingAcks.delete(messageId);
            console.error(`Failed to deliver message ${messageId} to user ${user.userId} after ${MAX_RETRIES} retries.`);
            // Optionally: Implement logic to notify the application or take other actions
          }
        }
      });
    }
  });
}, ACK_TIMEOUT / 2); // Check roughly twice per timeout period

console.log("WebSocket server started on port 8081");