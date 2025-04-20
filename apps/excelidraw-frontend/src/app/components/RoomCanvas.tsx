"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "../../../config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // const ws = new WebSocket(WS_URL);
    const ws = new WebSocket(
      `${WS_URL}?token=eyJhbGciOiJIUzI1NiJ9.ZTQ3NjYzNDgtMDI0Yi00OTgyLTk4ZWItZmVjMDE2ZDYyMDhi.XexxVK_5VNU_qdBWRBrM6B6_xYMsv5aCTKsCnzh9KlY`
    );
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };
  }, []);

  if (!socket) {
    return <div>Connecting to server</div>;
  }

  return (
    <div>
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
