import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {prismaClient} from "@repo/db/client"
import dotenv from "dotenv";
import path, { parse } from "path";
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import {WsDataType, WebSocketMessage, WebSocketChatMessage} from "@repo/common/types"

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
  connectionId:string,
  ws:WebSocket,
  rooms:string[],
  userId:string,
  pendingAcks: Map<string, PendingAckMessage>; // Map messageId to message details
}

const users: User[] =[]
const roomShapes: Record<string, WebSocketMessage[]>={};
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

  
/*   if (!userId) {
    console.error("Connection rejected: invalid user");
    ws.close(1008, "User not authenticated");
    return;
  } */

  const connectionId = generateConnectionId();
  
  // const newConnection: Connection = {
  //   connectionId,
  //   userId,
  //   userName: userId,
  //   ws,
  //   rooms: [],
  // };
  // connections.push(newConnection);
  
  users.push({
    connectionId,
    userId,
    rooms:[],
    ws,
    pendingAcks: new Map(), // Initialize pendingAcks map
  })
  

  ws.send(
    JSON.stringify({
      type: WsDataType.CONNECTION_READY,
      connectionId,
    })
  );
  console.log("✅ Sent CONNECTION_READY to:", connectionId);

  ws.on("error", (err) =>
    console.error(`WebSocket error for user ${userId}:`, err)
  );
  
  ws.on('message', async function message(data) {

    const parsedData:WebSocketMessage  = JSON.parse(data.toString()); // {type:"join-room", roomId:1}
    // const parsedData = JSON.parse(data as unknown as string); // {type: "join-room", roomId: 1}
    console.log("Parsed data: ", parsedData)

     const connection = users.find(
        (x) => x.connectionId === connectionId
      );
    
    if (!connection) {  
      console.error(`Connection is false: ${connectionId}`);
      return;
    }
     
    if(connection === null){
      console.error(`Connection is null: ${connectionId}`);
      return;
    }

    if(connection ===undefined){
      console.error(`Connection is undefined: ${connectionId}`);
      return;
    }
    
     switch (parsedData.type) {

    case WsDataType.JOIN:
      {
      // console.log("From join room ws is: ",  ws)
      // check here does this already room exists
      const user =  users.find(x=>x.ws===ws);
      user?.rooms.push(parsedData.roomId);
      }
    break;

    case WsDataType.LEAVE:
      {
      const user = users.find(x=>x.ws===ws);
      if(!user){
        return;
      }
      
      // room -> roomId
      user.rooms = user.rooms.filter(x=>x===parsedData.roomId);
    }
    break;

    case WsDataType.CHAT:
    {
        const {roomId, message} = parsedData;

        if(message == null){
          return;
        }

        // check if the message type is string or not. if not then return 
        if(typeof message!=="string"){
          console.error("Message is not a string");
          return;
        }
        
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
              type: WsDataType.CHAT,
              message,
              roomId
            });
          }
        })
    }
    break;

    case WsDataType.ACKNOWLEDGE: {
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
    break;
    
    case WsDataType.STREAM_SHAPE:
      {

        const {roomId, message, messageId} = parsedData;

        broadcastToRoom(roomId, {
          id: parsedData.id ?? null,
          type: parsedData.type ?? "join",
          connectionId: connection.connectionId ?? "1",
          message: message ?? "hi",
          messageId: messageId ?? uuidv4(), // Generate a new messageId if not provided
          roomId: roomId ?? "1",
          userId: connection.userId ?? "1"
          });
      }
      break;
    case WsDataType.STREAM_UPDATE:
      {

      } 
    } 
  });
  // ws.send('something');
  // case WsDataType.STREAM_UPDATE:
    //   {
    //     broadcastToRoom(parsedData.roomId, {
    //       type: parsedData.type,
    //       id: parsedData.id,
    //       message: parsedData.message,
    //       roomId: parsedData.roomId,
    //       userId: connection.userId,
    //       userName: connection.userName,
    //       connectionId: connection.connectionId,
    //     });
    //   }
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

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function broadcastToRoom(roomId: string, message: WebSocketMessage) {
  users.forEach(user => {
    if (user.rooms.includes(roomId)) {
      sendWithAck(user, {
        id: message.id ?? null,
        type: message.type,
        connectionId: message.connectionId ?? "1",
        messageId: message.messageId ?? uuidv4(), // Generate a new messageId if not provided
        message: message.message,
        roomId: roomId,
        userId: message.userId,
        // connectionId: message.connectionId,
        // userName: message.userName,
        // participants: message.participants,
        // timestamp: message.timestamp
      });
    }
  });
}

console.log("WebSocket server started on port 8081");