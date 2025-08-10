import { api } from "@/app/lib/api";
import { HTTP_BACKEND } from "../config";

export async function getExistingShapes(roomId:string){

    const response =  await api.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = response.data.messages;
    console.log("result for message from excelidraw fronted is: ", messages);

    const shapes = messages.map((x:{message:string})=>{
        const messageData = JSON.parse(x.message) // converting string to object {type: , message:}
        return messageData.shape;
    })
    
    return shapes;
}

export async function postShape(roomId: string, message: string) {
    await api.post(`${HTTP_BACKEND}/chats`, {
        roomId: Number(roomId),
        message
    });
}