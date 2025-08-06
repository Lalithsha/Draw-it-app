"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "../../../config";
import { Canvas } from "./Canvas";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
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
