"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "../../../config";
import { Canvas } from "./Canvas";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { HTTP_BACKEND } from "../../../config";
import { api } from "../lib/api";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  useEffect(() => {
    // const ws = new WebSocket(WS_URL);
    // `${WS_URL}?token=eyJhbGciOiJIUzI1NiJ9.ZTQ3NjYzNDgtMDI0Yi00OTgyLTk4ZWItZmVjMDE2ZDYyMDhi.XexxVK_5VNU_qdBWRBrM6B6_xYMsv5aCTKsCnzh9KlY`
    if (!session || !session?.accessToken) {
      console.log("Waiting for session and token...");
      setSocket(null);
      return;
    }
    const ws = new WebSocket(`${WS_URL}?token=${session?.accessToken}`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };
  }, [session?.accessToken, roomId]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="mb-4 text-lg font-semibold">
          You must be signed in to access the canvas.
        </div>
        <button
          className="px-4 py-2 bg-excali-purple text-white rounded hover:bg-purple-700"
          onClick={() => router.push("/signin")}
        >
          Go to Login
        </button>
        <button
          className="mt-2 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          onClick={() => router.push("/signup")}
        >
          Sign Up
        </button>
      </div>
    );
  }

  if (!socket) {
    return <div>Connecting to server</div>;
  }

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <Canvas roomId={roomId} socket={socket} />
      <div className="absolute top-2 right-4 z-10">
        <Button
          className="bg-excali-purple hover:bg-purple-700"
          onClick={() => {
            setShareLink("");
            setShareOpen(true);
          }}
        >
          Share
        </Button>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Live collaboration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Your name</div>
              <Input readOnly value={session?.user?.name ?? "Anonymous"} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Link</div>
              <div className="flex gap-2">
                <Input readOnly value={shareLink} placeholder="Generating..." />
                <Button
                  onClick={() => {
                    if (shareLink) navigator.clipboard.writeText(shareLink);
                  }}
                >
                  Copy link
                </Button>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <Button
                className="bg-excali-purple hover:bg-purple-700"
                onClick={async () => {
                  try {
                    const slug = `room-${Math.random().toString(36).slice(2, 8)}`;
                    const res = await api.post(`${HTTP_BACKEND}/room`, {
                      name: slug,
                    });
                    const createdRoomId: number = res.data.roomId;
                    const origin =
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "";
                    const link = `${origin}/canvas/${createdRoomId}`;
                    setShareLink(link);
                    // Navigate to new collaborative room
                    router.push(`/canvas/${createdRoomId}`);
                  } catch (e) {
                    console.error("Failed to start session", e);
                  }
                }}
              >
                Start session
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <canvas
        ref={canvasRef}
        width={1534}
        height={693}
        style={{ border: "1px solid black" }}
      ></canvas> */}
      {/* <div className="absolute bottom-0 right-0">
        <button className="bg-white text-black m-2 p-2 rounded-md">
          Rectangle
        </button>
        <button className="bg-white text-black m-2 p-2 rounded-md">
          Circle
        </button>
      </div> */}
    </div>
  );
}
