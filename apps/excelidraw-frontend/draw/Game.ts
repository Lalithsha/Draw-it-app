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

    private selectedTool:tool = tool.Pencil;
    
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
            }
            else if(shape.type === 'pencil'){
                // this.ctx.beginPath();
                // this.ctx.strokeStyle = "rgba(255,255,255)";
                this.ctx.lineCap = 'round'; // Good for smoother pencil strokes
                this.ctx.lineJoin = 'round'; // Good for smoother pencil strokes
                this.ctx.moveTo(shape.startX, shape.startY);
                // this.ctx.lineTo(shape.endX,shape.endY);
                this.ctx.lineTo(shape.endX,shape.endY);
                this.ctx.stroke();
            }
        })
    }
    

    // Converts mouse event coordinates to canvas-relative coordinates
    private getMousePosition(e:MouseEvent):{x:number, y:number}{

        const rect = this.canvas.getBoundingClientRect();
        return {
            x:e.clientX - rect.left,
            y:e.clientY - rect.top
        }
        
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
        else if(selectedTool === "pencil"){
            // shape = {
            //     type:"pencil",
            //     startX: this.startX,
            //     startY:this.startY,
            //     endX:e.clientX - this.canvas.offsetLeft,
            //     endY:e.offsetY - this.canvas.offsetTop
            // }
            // this.clicked = false;
            shape = null;
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

        // Redraw the canvas to show the final shape (for rect, line, circle)
        // or just to clear any temporary previews if no shape was finalized (e.g. pencil).
        this.clearCanvas();
    }
    
    mouseMoveHandler=(e:MouseEvent)=>{

        if(!this.clicked){
            return;
        }

        const pos = this.getMousePosition(e);
        const currentX = pos.x;
        const currentY = pos.y;

        if(this.selectedTool === "pencil"){
            const pencilSegment: Shape = {
                type: "pencil",
                startX: this.startX,  // Previous point's X (canvas relative)
                startY :this.startY,  // Previous point's Y (canvas relative)
                endX: currentX,  // Current point's X (canvas relative)
                endY: currentY // Current point's Y (canvas relative)
            }

            this.existingShape.push(pencilSegment);
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: pencilSegment }),
                roomId: this.roomId
            }));

            // IMPORTANT: Update startX and startY to the current position
            // This makes the current end point the start point for the next segment
            this.startX = currentX;
            this.startY = currentY;
            // Redraw the canvas to show the new segment immediately
            this.clearCanvas();
            
        }
        
        
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
            // else if(selectedTool === "pencil"){
            //     // this.ctx.beginPath();
            //     // this.ctx.lineCap = 'round';
            //     // this.ctx.moveTo(this.startX, this.startY);
            //     // // this.ctx.lineTo(e.offsetX,e.offsetY);
            //     // this.ctx.lineTo(e.clientX -  this.canvas.offsetLeft, e.clientY - this.canvas.offsetTop);
            //     // this.ctx.stroke();
            //     // // this.ctx.closePath();

            //     // Create a new segment for the pencil stroke
                
            // }
        }
    }
    
    initMouseHandlers(){
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);

        this.canvas.addEventListener("mouseleave", ()=>{
            if(this.clicked){
                this.clicked = false;
                this.clearCanvas();
            }
        })
        
    }

    destroy(){       
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        // this.canvas.removeEventListener("mouseleave", () => { this.clicked = false; this.clearCanvas(); });
        // this.clicked = false;
        // this.socket.close();
        // this.existingShape = [];
    }
    
    
}