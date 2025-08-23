"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "../../../config";
import { Canvas } from "./Canvas";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { CanvasShareModal } from "@repo/ui/components/canvas-share-modal";
import { ThemeToggleButton } from "@repo/ui/components/theme-toggle";
import {
  CanvasSidebar,
  CanvasSidebarTrigger,
} from "@repo/ui/components/canvas-sidebar";
import { HTTP_BACKEND } from "../../../config";
import { api } from "../lib/api";
import { useShareModal } from "../hooks/use-share-modal";
import { useOrigin } from "../hooks/use-client";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const origin = useOrigin();
  const { shareOpen, setShareOpen, shareModalProps, setShareLink } =
    useShareModal({
      roomId: roomId,
    });

  useEffect(() => {
    // Local solo mode: no WS
    if (roomId === "local") {
      setSocket(null);
      return;
    }
    // Use session access token when available; fall back to guest_access_token
    let token: string | null = null;
    if (session?.accessToken) token = session.accessToken as string;
    if (!token) {
      try {
        token = localStorage.getItem("guest_access_token");
      } catch {}
    }
    if (!token) {
      setSocket(null);
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };
  }, [session?.accessToken, session, roomId]);

  // Guests are allowed (collab via guest token or local solo)

  // When solo (no socket), still render Canvas which will use HTTP persistence

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      {/* Sidebar container renders over canvas */}
      <CanvasSidebar
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onFind={() => {
          // placeholder: could open a command palette in future
          setSidebarOpen(false);
        }}
        onOpenShare={() => {
          setSidebarOpen(false);
          setShareOpen(true);
        }}
        isAuthenticated={!!session}
        onSignIn={() => router.push("/signin")}
        onSignOut={async () => {
          await signOut({ callbackUrl: "/" });
        }}
      >
        {/* Canvas sits beneath/with sidebar sibling */}
        <div className="w-full h-full">
          {/* Menu trigger top-left */}
          <div className="fixed top-3 left-3 z-50">
            <CanvasSidebarTrigger onClick={() => setSidebarOpen(true)} />
          </div>
          {/* Canvas */}
          <Canvas roomId={roomId} socket={socket} />
        </div>
      </CanvasSidebar>

      {/* Single trigger provided inside CanvasSidebar; avoid duplicate overlapping triggers */}

      {/* Share and theme toggle top-right */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <ThemeToggleButton />
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
          try {
            if (roomId === "local" && origin) {
              const endpoint = session?.user?.id
                ? `${HTTP_BACKEND}/room`
                : `${HTTP_BACKEND}/room/guest`;
              const res = await api.post(endpoint);
              const createdRoomId: string = res.data.roomId;
              const link = `${origin}/canvas/${createdRoomId}`;
              setShareLink(link);
              router.push(`/canvas/${createdRoomId}`);
            }
          } catch (e) {
            console.error("Failed to start session", e);
          }
        }}
      />

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
