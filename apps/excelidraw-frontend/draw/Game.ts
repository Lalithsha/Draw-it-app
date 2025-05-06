import { tool } from "@/app/components/Canvas";
import { getExistingShapes } from "./http";

export type Shape = {
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
    startX:number;
    startY:number;
    endX:number;
    endY:number;
} | {
    type: "pencil",
    startX:number;
    startY:number;
    endX:number;
    endY:number;
}


export class Game {

    private canvas: HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;
    private existingShape: Shape [];
    private roomId:string;
    private clicked : boolean;
    private startX:number = 0;
    private startY:number = 0;

    private selectedTool:tool = tool.Rectangle;
    
    socket: WebSocket;
    
    constructor(canvas: HTMLCanvasElement, roomId:string, socket: WebSocket){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.existingShape = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    async init(){
        this.existingShape = await getExistingShapes(this.roomId); // Replace with actual roomId
        this.clearCanvas();
    }

    setTool(tool: tool ){
        this.selectedTool = tool;
    }
    
    initHandlers(){
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'chat') {
                const parsedData = JSON.parse(message.message);
                this.existingShape.push(parsedData.shape);
                this.clearCanvas();
                
                // Send acknowledgment if messageId exists
                if (message.messageId) {
                    this.socket.send(JSON.stringify({
                        type: "ack",
                        messageId: message.messageId
                    }));
                }
            }
        }
    }

    clearCanvas(){

        if(!this.ctx){
            return null;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
        this.existingShape.map((shape)=>{
            if(shape.type==='rect'){
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            else if(shape.type === 'circle'){
                this.ctx.beginPath();
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke(); // Added stroke for circle outline
                this.ctx.closePath();
            }
            else if(shape.type === 'line'){
                this.ctx.beginPath();
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.moveTo(shape.startX, shape.startY); 
                this.ctx.lineTo(shape.endX, shape.endY); // Example line length
                // this.ctx.lineTo(shape.centerX, shape.y); // Example line length
                this.ctx.stroke();
                this.ctx.closePath();
            }
        })
    }
    

    mouseDownHandler = (e:MouseEvent) => {
        this.clicked = true;    
        this.startX = e.clientX;
        this.startY = e.clientY;
    }
    
    mouseUpHandler = (e:MouseEvent) => {
        this.clicked = false;
        console.log("Mouse up", e.clientX);
        console.log("Mouse up", e.clientY);

        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        
        const selectedTool = this.selectedTool;
        
        let shape:Shape |null = null ;
        
        if(selectedTool ==="line"){
            shape = {
                type:"line", 
                startX: this.startX,
                startY: this.startY,
                endX: e.clientX,
                endY: e.clientY
            }
            console.log("Line shape", shape);
        }
        else if(selectedTool === "rect"){        
            shape = {
                type:"rect",
                x:this.startX,
                y:this.startY,
                width,
                height
            }
        }
        else if(selectedTool==="circle"){
            const radius = Math.max(width, height)/2;
            shape = {
                type:"circle",
                centerX: this.startX + width /2,
                centerY: this.startY + height/2,
                radius: radius,
            }
        }

        if(!shape){
            return;
        }
        
        this.existingShape.push(shape)
        this.socket.send(JSON.stringify({
                    type:"chat",
                    message:JSON.stringify({shape}),
                    roomId: this.roomId
                }   
            ))
    }
    
    mouseMoveHandler=(e:MouseEvent)=>{
        if (this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            const selectedTool = this.selectedTool;
            if(selectedTool === "rect"){  
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            }
            else if(selectedTool === "line"){
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY); 
                this.ctx.lineTo(e.clientX, e.clientY);
                this.ctx.stroke();
                this.ctx.closePath();
                console.log("Line created ", e.clientX, e.clientY)
            }
            else if(selectedTool ==="circle"){
                const centerX = this.startX + width /2 ;
                const centerY = this.startY + height /2;
                const radius = Math.max(width, height)/2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke(); // Added stroke for circle outline
                this.ctx.closePath();
            }
        }
    }
    
    initMouseHandlers(){
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }

    destroy(){       
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        // this.socket.close();
        // this.existingShape = [];
    }
    
    
}