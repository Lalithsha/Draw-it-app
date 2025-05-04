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
} | {
    type: "line",
    x:number;
    y:number;
}


export default async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, shapee: string){
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
        
        let shape:Shape |null = null ;
        
        if(shapee ==="line"){
            shape = {
                type:"line", 
                x:startX,
                y:startY
            }
            // existingShape.push(shape);
            // socket.send(JSON.stringify({
            //     type:"chat",
            //     message: JSON.stringify({shape}),
            //     roomId
            // }))
        }
        else if(shapee === "rectangle"){        
            const width = e.clientX-startX;
            const height = e.clientY-startY;
            shape = {
                type:"rect",
                x:startX,
                y:startY,
                width,
                height
            }
            // existingShape.push(shape)
            // socket.send(JSON.stringify({
            //         type:"chat",
            //         message:JSON.stringify({shape}),
            //         roomId
            //     }   
            // ))
        }
        else if(shapee==="circle"){
            const radius = Math.max(width, height)/2;
            shape = {
                type:"circle",
                centerX:startX+radius,
                centerY:startY+radius,
                radius: radius,
            }
        }

        if(!shape){
            return;
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
            if(shapee === "rectangle"){
            clearCanvas(existingShape, canvas);
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.strokeRect(startX, startY, width, height);
            }
            else if(shapee === "line"){
                clearCanvas(existingShape, canvas);
                ctx.strokeStyle ="rgba(255,255,255)";
                ctx.beginPath();
                ctx.moveTo(startX, startY); 
                ctx.lineTo(e.clientX, e.clientY);
                ctx.stroke();
                ctx.closePath();
            }
            else if(shapee ==="circle"){
                const centerX = startX + width /2 ;
                const centerY = startY + height /2;
                clearCanvas(existingShape, canvas);
                const radius = Math.max(width, height)/2;
                ctx.beginPath();
                ctx.strokeStyle = "rgba(255, 255, 255)";
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke(); // Added stroke for circle outline
                ctx.closePath();
            }
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
        else if(shape.type === 'circle'){
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            ctx.stroke(); // Added stroke for circle outline
            ctx.closePath();
        }
        else if(shape.type === 'line'){
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.moveTo(shape.x, shape.y); 
            ctx.lineTo(shape.x+100, shape.y+100); // Example line length
            ctx.stroke();
            ctx.closePath();
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

