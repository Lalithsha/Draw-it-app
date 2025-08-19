"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CanvasShareModal } from "@repo/ui/components/canvas-share-modal";
import { Button } from "@repo/ui/components/button";
import { api } from "./lib/api";
import { HTTP_BACKEND } from "../../config";
import { Canvas } from "./components/Canvas";
import { useShareModal } from "./hooks/use-share-modal";

export default function Home() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [draftRoomId, setDraftRoomId] = useState<string | null>(null);

  const { shareOpen, setShareOpen, shareModalProps, setShareLink } =
    useShareModal({
      roomId: draftRoomId,
    });

  useEffect(() => {
    const ensureSoloRoom = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await api.get(`${HTTP_BACKEND}/room/solo`);
        const roomId: string | undefined = res.data?.room?.id;
        if (roomId) setDraftRoomId(roomId);
      } catch (e) {
        console.error("Failed to ensure solo room", e);
      }
    };
    ensureSoloRoom();
  }, [session?.user?.id]);

  // Solo mode: skip WS
  useEffect(() => {
    setSocket(null);
  }, [draftRoomId]);

  // Guest solo: allow drawing locally using a synthetic roomId "local"
  if (!session) {
    return (
      <div style={{ height: "100vh", overflow: "hidden" }}>
        <Canvas roomId={"local"} socket={null} />
      </div>
    );
  }

  if (!draftRoomId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        Loading canvas…
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <Canvas roomId={draftRoomId} socket={socket} />
      <div className="absolute top-3 right-4 z-50">
        <Button
          className="bg-white text-black border shadow dark:bg-black dark:text-white"
          variant="outline"
          onClick={() => {
            setShareOpen(true);
          }}
        >
          Share
        </Button>
      </div>
      <CanvasShareModal
        {...shareModalProps}
        onStartSession={async () => {
          // In the home page, draftRoomId is always a real room ID, not 'local'
          if (draftRoomId) {
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const link = `${origin}/canvas/${draftRoomId}`;
            window.location.href = `/canvas/${draftRoomId}`;
          }
        }}
      />
    </div>
  );
}
