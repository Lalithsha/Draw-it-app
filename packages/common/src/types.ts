import {z} from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(3,{message:"Username must be greater than 3 characters"}).max(50,{message:"Username must be less than 50 characters"}),
    password: z.string().min(6,{message:"Password must be greater than 3 characters"}).max(20,{message:"Password cannot be greater than 20 characters"}),
    name: z.string().min(3).max(20)
})
export const SigninSchema = z.object({
    username: z.string().min(3,{message:"Username must be greater than 3 characters"}).max(20,{message:"Username must be less than 20 characters"}),
    password: z.string().min(3).min(6,{message:"Password must be greater than 3 characters"}).max(20,{message:"Password cannot be greater than 20 characters"}),
})
export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20) 
})


export enum WsDataType {
  JOIN = "join_room",
  LEAVE = "leave_room",
  CHAT = "chat",
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  DRAW = "DRAW",
  ERASER = "ERASER",
  UPDATE = "UPDATE",
  EXISTING_PARTICIPANTS = "EXISTING_PARTICIPANTS",
  CLOSE_ROOM = "CLOSE_ROOM",
  CONNECTION_READY = "CONNECTION_READY",
  EXISTING_SHAPES = "EXISTING_SHAPES",
  STREAM_SHAPE = "STREAM_SHAPE",
  STREAM_UPDATE = "STREAM_UPDATE",
  CURSOR_MOVE = "CURSOR_MOVE",
  ACKENOWLEDGE = "ack",
}

export type RoomParticipants = {
  userId: string;
  userName: string;
};


export interface WebSocketMessage {
  id: string | null;
  type: WsDataType;
  connectionId: string;
  roomId: string;
  userId: string;
  userName: string | null;
  message: string | null;
  participants: RoomParticipants[] | null;
  timestamp: string | null;
  messageId: string;
}

export interface WebSocketChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: WsDataType;
}