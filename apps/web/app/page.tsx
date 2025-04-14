"use client";
// import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <div>
        <input
          style={{ padding: 10, margin: 5 }}
          type="text"
          placeholder="Room id"
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button
          style={{ padding: 10, margin: 5 }}
          onClick={() => {
            router.push(`/room/${roomId}`);
          }}
        >
          Join room
        </button>
      </div>
    </div>
  );
}
