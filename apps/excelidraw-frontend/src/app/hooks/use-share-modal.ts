"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOrigin } from "./use-client";

export function useShareModal({ roomId }: { roomId: string | null }) {
  const { data: session } = useSession();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const origin = useOrigin();

  useEffect(() => {
    if (shareOpen && roomId && roomId !== "local" && origin) {
      setShareLink(`${origin}/canvas/${roomId}`);
    } else if (!shareOpen) {
      setShareLink(""); // Clear link when modal is closed
    }
  }, [shareOpen, roomId, origin]);

  return {
    shareOpen,
    setShareOpen,
    shareLink,
    setShareLink,
    shareModalProps: {
      open: shareOpen,
      onClose: () => setShareOpen(false),
      userName: session?.user?.name ?? "Anonymous",
      shareLink: shareLink,
      onCopy: () => shareLink && navigator.clipboard.writeText(shareLink),
    },
  };
}
