"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HTTP_BACKEND } from "../../config";
import { Canvas } from "./components/Canvas";
import { api } from "./lib/api";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";

export default function Home() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [draftRoomId, setDraftRoomId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");

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

  if (!session) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        Please login to start drawing.
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
                <Input
                  readOnly
                  value={shareLink}
                  placeholder="Click Start session"
                />
                <Button
                  onClick={() =>
                    shareLink && navigator.clipboard.writeText(shareLink)
                  }
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
                    const res = await api.post(`${HTTP_BACKEND}/room`);
                    const createdRoomId: string = res.data.roomId;
                    const origin =
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "";
                    const link = `${origin}/canvas/${createdRoomId}`;
                    setShareLink(link);
                    window.location.href = `/canvas/${createdRoomId}`;
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
    </div>
  );
}
