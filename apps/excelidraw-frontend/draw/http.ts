import { api } from "@/app/lib/api";
import { HTTP_BACKEND } from "../config";
import type { Shape } from "../types/canvas";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
  const response = await api.get(`${HTTP_BACKEND}/chats/${roomId}`);
  const messages = response.data.messages;
  return messages.map((x: { message: string }) => JSON.parse(x.message).shape as Shape);
}

export async function postShape(roomId: string, message: string) {
  await api.post(`${HTTP_BACKEND}/chats`, {
    roomId: Number(roomId),
    message,
  });
}