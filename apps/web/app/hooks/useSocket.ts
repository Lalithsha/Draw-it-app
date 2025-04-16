import { useEffect, useState } from "react";
import { WS_URL } from "../config";

// Define a type for chat messages
interface ChatMessage {
    type: string;
    message: string;
    roomId: string;
    messageId?: string; // Optional messageId for ACK mechanism
    // Add other potential message properties if needed
}

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [socket,setSocket] = useState<WebSocket>();
    // Use the specific ChatMessage type
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(()=>{
        
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiJ9.ZTQ3NjYzNDgtMDI0Yi00OTgyLTk4ZWItZmVjMDE2ZDYyMDhi.XexxVK_5VNU_qdBWRBrM6B6_xYMsv5aCTKsCnzh9KlY`);
        ws.onopen = ()=>{
            setLoading(false);
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                // Explicitly type the parsed data
                const messageData: ChatMessage = JSON.parse(event.data);
                console.log("Received message:", messageData);

                // Check if the message requires an acknowledgment
                if (messageData.messageId) {
                    console.log(`Sending ACK for messageId: ${messageData.messageId}`);
                    // Send ACK back to the server
                    ws.send(JSON.stringify({ type: 'ack', messageId: messageData.messageId }));
                }

                // Process the actual message content (e.g., update chat)
                if (messageData.type === 'chat') {
                    // Ensure the object added conforms to ChatMessage
                    setMessages((prev) => [...prev, messageData]);
                }
                // Handle other message types if needed

            } catch (error) {
                console.error("Failed to parse message or error in onmessage handler:", error);
            }
        };
    },[]);
    return {
        loading, socket, messages
    }
    
}