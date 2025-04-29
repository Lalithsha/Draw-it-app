import axios from "axios";
import { HTTP_BACKEND } from "../config";

type Shape = {
    type:"rect";
    x:number;
    y:number;
    width:number;
    height:number;
} | {
    type:"circle";
    centerX:number;
    centerY:number;
    radius:number;
}


export default async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket){
    const ctx = canvas.getContext("2d");

    // State variable
    let existingShape: Shape[] = await getExistingShapes(roomId);
    
    if (!ctx) {
        return;
    }

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'chat') {
            const parsedData = JSON.parse(message.message);
            existingShape.push(parsedData.shape);
            clearCanvas(existingShape, canvas);
            
            // Send acknowledgment if messageId exists
            if (message.messageId) {
                socket.send(JSON.stringify({
                    type: "ack",
                    messageId: message.messageId
                }));
            }
        }
    }

    clearCanvas(existingShape, canvas);

    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        console.log("Mouse up", e.clientX);
        console.log("Mouse up", e.clientY);
        const width = e.clientX-startX;
        const height = e.clientY-startY;
        const shape:Shape = {
            type:"rect",
            x:startX,
            y:startY,
            width,
            height
        }
        existingShape.push(shape)
        socket.send(JSON.stringify({
                type:"chat",
                message:JSON.stringify({shape}),
                roomId
            }   
        ))

        
    });

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        clearCanvas(existingShape, canvas);
        ctx.strokeStyle = "rgba(255, 255, 255)";
        ctx.strokeRect(startX, startY, width, height);
        }
    });
}

function clearCanvas(existingShape:Shape[], canvas: HTMLCanvasElement){

    const ctx = canvas.getContext("2d");
    if(!ctx){
        return null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    existingShape.map((shape)=>{
        if(shape.type==='rect'){
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
    })
    
}


async function getExistingShapes(roomId:string){

    const response =  await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = response.data.messages;
    console.log("result for message from excelidraw fronted is: ", messages);

    const shapes = messages.map((x:{message:string})=>{
        const messageData = JSON.parse(x.message) // converting string to object {type: , message:}
        return messageData.shape;
    })
    
    return shapes;
}

