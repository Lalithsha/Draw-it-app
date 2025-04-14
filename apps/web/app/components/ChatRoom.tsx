import axios from "axios";
import { BACKEND_URL, WS_URL } from "../config";
import { ChatRoomClient } from "./ChatRoomClient";

async function getChats(roomId: string | number) {
  console.log(`${WS_URL}/chats/${roomId}`);
  const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
  console.log("Response from chats is: ", response);
  return response.data.messages;
}

export async function ChatRoom({ id }: { id: string }) {
  const messages = await getChats(id);
  return <ChatRoomClient id={id} messages={messages} />;
}
