import { api } from "@/app/lib/api";
import { HTTP_BACKEND } from "../config";
import type { Shape } from "../types/canvas";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
  if (roomId === "local") {
    try {
      const raw = localStorage.getItem("local_shapes");
      const arr = raw ? (JSON.parse(raw) as Shape[]) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  const response = await api.get(`${HTTP_BACKEND}/shapes/${roomId}`);
  const shapes = response.data.shapes as { message: string }[];
  return shapes.map((x) => JSON.parse(x.message).shape as Shape);
}

export async function postShape(roomId: string, message: string) {
  if (roomId === "local") {
    try {
      const parsed = JSON.parse(message) as { shape: Shape };
      const raw = localStorage.getItem("local_shapes");
      const arr = raw ? (JSON.parse(raw) as Shape[]) : [];
      arr.push(parsed.shape);
      localStorage.setItem("local_shapes", JSON.stringify(arr));
    } catch {}
    return;
  }
  await api.post(`${HTTP_BACKEND}/shapes`, { roomId, message });
}