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
  isGuest:boolean,
  roomScope:string | null,
  pendingAcks: Map<string, PendingAckMessage>; // Map messageId to message details
}

const users: User[] =[]
const roomShapes: Record<string, WebSocketMessage[]>={};
const ACK_TIMEOUT = 5000; // 5 seconds timeout for acknowledgments
const MAX_RETRIES = 3; // Maximum number of times to resend a message

function checkUser(token: string): { userId: string; isGuest: boolean; roomScope: string | null } | null {
  try {
    const secret = (process.env.JWT_SECRET || "lal32i") as string;
    const decoded = jwt.verify(token, secret) as unknown as {
      id?: string | number;
      type?: string;
      roomId?: string;
      iat?: number;
      exp?: number;
    };
    if (!decoded || decoded.type !== "access" || decoded.id == null) {
      return null;
    }
    const idStr = String(decoded.id);
    const isGuest = idStr.startsWith("guest:");
    const roomScope = decoded.roomId ?? null;
    return { userId: idStr, isGuest, roomScope };
  } catch (e) {
    console.error("Failed to verify JWT in ws-backend:", e);
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
  const auth = checkUser(token);
  console.log("From ws backend the token is: ", token)
  console.log("From ws backend the userId is: ", auth?.userId)
  console.log("User connected: ", auth?.userId)
  if(auth==null){
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
    userId: auth.userId,
    rooms:[],
    isGuest: auth.isGuest,
    roomScope: auth.roomScope,
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
    console.error(`WebSocket error for user ${auth.userId}:`, err)
  );

  ws.on('close', async () => {
    try {
      const idx = users.findIndex(u => u.connectionId === connectionId);
      if (idx !== -1) {
        const leaving = users.splice(idx, 1)[0];
        if (leaving) {
          const leavingRooms = [...leaving.rooms];
          for (const r of leavingRooms) {
            await maybeDeleteRoomIfEmpty(r);
          }
        }
      }
    } catch (e) {
      console.error('Error handling ws close', e);
    }
  });
  
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
      const user =  users.find(x=>x.ws===ws);
      if (!user) {
        console.error("User not found");
        return;
      }
      if (user.roomScope && user.roomScope !== parsedData.roomId) {
        console.error("Guest token scope mismatch", user.roomScope, parsedData.roomId);
        return;
      }
      user.rooms.push(parsedData.roomId);
      }
    break;

    case WsDataType.LEAVE:
      {
      const user = users.find(x=>x.ws===ws);
      if(!user){
        return;
      }
      
      // remove room membership
      user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
      await maybeDeleteRoomIfEmpty(parsedData.roomId);
    }
    break;

    // Backward compatibility: accept CHAT, but prefer STREAM_SHAPE going forward
    case WsDataType.CHAT:
    {
        const {roomId, message} = parsedData;

        if(message == null){
          return;
        }

        if(typeof message!=="string"){
          console.error("Message is not a string");
          return;
        }

        if (!roomId || typeof roomId !== 'string') {
          console.error("Invalid roomId for shape:", roomId);
          return;
        }

        // validate payload
        let parsed;
        try { parsed = JSON.parse(message); } catch { console.error("Invalid shape payload JSON"); return; }
        if (parsed === null || typeof parsed !== 'object' || !('shape' in parsed)) { console.error("Invalid shape payload shape"); return; }

        if (auth.isGuest) {
          await prismaClient.shape.create({ data: ({ roomId, message } as any) });
        } else {
          await prismaClient.shape.create({ data: { roomId, message, userId: String(auth.userId) } });
        }

        users.forEach(user=>{
          if(user.rooms.includes(roomId)){
            // Use sendWithAck instead of ws.send directly
            sendWithAck(user, {
              type: WsDataType.STREAM_SHAPE,
              message,
              roomId
            });
          }
        })
    }
    break;

    case WsDataType.STREAM_SHAPE:
    {
      const { roomId, message } = parsedData;
      if(message == null){ return; }
      if(typeof message!=="string"){ console.error("Message is not a string"); return; }
      if (!roomId || typeof roomId !== 'string') { console.error("Invalid roomId for shape:", roomId); return; }

      let parsed2;
      try { parsed2 = JSON.parse(message); } catch { console.error("Invalid shape payload JSON"); return; }
      if (parsed2 === null || typeof parsed2 !== 'object' || !('shape' in parsed2)) { console.error("Invalid shape payload shape"); return; }

      if (auth.isGuest) {
        await prismaClient.shape.create({ data: ({ roomId, message } as any) });
      } else {
        await prismaClient.shape.create({ data: { roomId, message, userId: String(auth.userId) } });
      }

      users.forEach(user=>{
        if(user.rooms.includes(roomId)){
          sendWithAck(user, { type: WsDataType.STREAM_SHAPE, message, roomId });
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
    
    // (duplicate STREAM_SHAPE handler removed)
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

async function maybeDeleteRoomIfEmpty(roomId: string) {
  // For any room, if no users remain connected, delete shapes and the room
  try {
    const hasAny = users.some(u => u.rooms.includes(roomId));
    if (!hasAny) {
      await prismaClient.shape.deleteMany({ where: { roomId } });
      await prismaClient.room.delete({ where: { id: roomId } });
      console.log(`Deleted room ${roomId} and its shapes (no users remain)`);
    }
  } catch (e) {
    console.error('maybeDeleteRoomIfEmpty error', e);
  }
}

console.log("WebSocket server started on port 8081");