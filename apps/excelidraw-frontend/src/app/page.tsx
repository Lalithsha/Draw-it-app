"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CanvasShareModal } from "@repo/ui/components/canvas-share-modal";
import { Button } from "@repo/ui/components/button";
import { api } from "./lib/api";
import { HTTP_BACKEND } from "../../config";
import { RoomCanvas } from "./components/RoomCanvas";
import { useShareModal } from "./hooks/use-share-modal";
import { useOrigin } from "./hooks/use-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [draftRoomId, setDraftRoomId] = useState<string | null>(null);
  const origin = useOrigin();
  const router = useRouter();

  const { shareOpen, setShareOpen, shareModalProps, setShareLink } =
    useShareModal({
      roomId: draftRoomId,
    });

  useEffect(() => {
    const ensureSoloRoom = async () => {
      if (session?.user?.id) {
        try {
          const res = await api.get(`${HTTP_BACKEND}/room/solo`);
          const roomId: string | undefined = res.data?.room?.id;
          if (roomId) setDraftRoomId(roomId);
        } catch (e) {
          console.error("Failed to ensure solo room", e);
        }
      }
    };
    if (status === "authenticated") {
      ensureSoloRoom();
    }
  }, [session?.user?.id, status]);

  // Solo mode: skip WS
  useEffect(() => {
    setSocket(null);
  }, [draftRoomId]);

  if (status === "loading") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Guest solo: allow drawing locally using a synthetic roomId "local"
  if (status === "unauthenticated") {
    return <RoomCanvas roomId={"local"} />;
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
      <RoomCanvas roomId={draftRoomId} />
      <CanvasShareModal
        {...shareModalProps}
        onStartSession={async () => {
          // In the home page, draftRoomId is always a real room ID, not 'local'
          if (draftRoomId && origin) {
            const link = `${origin}/canvas/${draftRoomId}`;
            router.push(`/canvas/${draftRoomId}`);
          }
        }}
      />
    </div>
  );
}
