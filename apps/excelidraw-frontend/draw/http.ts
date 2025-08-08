import axios from "axios";
import { HTTP_BACKEND } from "../config";

export async function getExistingShapes(roomId:string){

    const response =  await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, { withCredentials: true });
    const messages = response.data.messages;
    console.log("result for message from excelidraw fronted is: ", messages);

    const shapes = messages.map((x:{message:string})=>{
        const messageData = JSON.parse(x.message) // converting string to object {type: , message:}
        return messageData.shape;
    })
    
    return shapes;
}
