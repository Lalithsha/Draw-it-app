"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
  messages,
  id,
}: {
  messages: { message: string }[];
  id: string;
}) {
  const [chats, setChats] = useState(messages);
  const [currentMessage, setCurrentMessage] = useState("");
  const { socket, loading } = useSocket();

  useEffect(() => {
    if (socket && !loading) {
      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId: id,
        })
      );
      // @ts-ignore
      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "chat") {
          setChats((c) => [...c, { message: parsedData.message }]);
        }
      };
    }
  }, [socket, loading, id]);

  function sendMessage() {
    socket?.send(
      JSON.stringify({
        type: "chat",
        roomId: id,
        message: currentMessage,
      })
    );
    setCurrentMessage("");
    console.log("send message", currentMessage);
  }

  return (
    <div>
      {chats.map((m, index) => (
        <div key={index}>{m.message}</div>
      ))}
      <input
        type="text"
        placeholder="Enter message"
        value={currentMessage}
        onChange={(e) => {
          setCurrentMessage(e.target.value);
        }}
      />

      <button onClick={() => sendMessage}>Send message</button>
    </div>
  );
}
