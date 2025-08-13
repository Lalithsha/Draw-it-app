import { api } from "@/app/lib/api";
import { HTTP_BACKEND } from "../config";
import type { Shape } from "../types/canvas";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
  const response = await api.get(`${HTTP_BACKEND}/shapes/${roomId}`);
  const shapes = response.data.shapes as { message: string }[];
  return shapes.map((x) => JSON.parse(x.message).shape as Shape);
}

export async function postShape(roomId: string, message: string) {
  await api.post(`${HTTP_BACKEND}/shapes`, {
    roomId,
    message,
  });
}