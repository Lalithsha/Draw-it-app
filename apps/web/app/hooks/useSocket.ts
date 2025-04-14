import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [socket,setSocket] = useState<WebSocket>();

    useEffect(()=>{
        
        // const ws = new WebSocket(WS_URL);
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiJ9.ZTQ3NjYzNDgtMDI0Yi00OTgyLTk4ZWItZmVjMDE2ZDYyMDhi.XexxVK_5VNU_qdBWRBrM6B6_xYMsv5aCTKsCnzh9KlY`);
        ws.onopen = ()=>{
            setLoading(false);
            setSocket(ws);
        }
    },[]);
    return {
        loading, socket
    }
    
}