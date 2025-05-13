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
    private previousX: number = 0;
    private previousY: number = 0;

    private viewportTransform: {
      x: number;
      y: number;
      scale: number;
    } = {
      x: 0,
      y: 0,
      scale: 1
    }

    private selectedTool:tool|null = null;
    
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

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
        
        if (this.selectedTool === null) { // Panning mode
            this.canvas.style.cursor = 'grab';
            this.previousX = e.clientX;
            this.previousY = e.clientY;
        } else { // Drawing mode
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.previousX = e.clientX;
            this.previousY = e.clientY;
        }
        
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
    
    mouseUpHandler = (e:MouseEvent) => {

        if (this.clicked) {
            this.clicked = false;
            this.canvas.style.cursor = 'default'; // Change cursor back to default
            // this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
            return;
        }
        
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

         this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        
    }
    
    mouseMoveHandler = (e:MouseEvent) => {
        if (!this.clicked) {
            return;
        }    
        
        if (this.selectedTool === null) { // Panning mode
            this.updatePanning(e);
            this.canvas.style.cursor = 'grabbing';
            this.clearCanvas();
            this.render();
            return;
        }
        
        // Drawing mode
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)";

        const pos = this.getMousePosition(e);
        const currentX = pos.x;
        const currentY = pos.y;

        // Handle different drawing tools
        if (this.selectedTool === "rect") {  
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "line") {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY); 
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === "circle") {
            const centerX = this.startX + width/2;
            const centerY = this.startY + height/2;
            const radius = Math.max(width, height)/2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === "pencil") {
            const pencilSegment: Shape = {
                type: "pencil",
                startX: this.startX,
                startY: this.startY,
                endX: currentX,
                endY: currentY
            }

            this.existingShape.push(pencilSegment);
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: pencilSegment }),
                roomId: this.roomId
            }));

            this.startX = currentX;
            this.startY = currentY;
        }

        this.render();
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

        this.canvas.addEventListener("wheel", this.onMouseWheel);
        
    }

    destroy(){       
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.onMouseWheel);
        // this.canvas.removeEventListener("mouseleave", () => { this.clicked = false; this.clearCanvas(); });
        // this.clicked = false;
        // this.socket.close();
        // this.existingShape = [];
    }

    render = () => {
    // Reset transform before clearing
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add black background
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply viewport transform
    this.ctx.setTransform(
        this.viewportTransform.scale, 
        0, 
        0, 
        this.viewportTransform.scale, 
        this.viewportTransform.x, 
        this.viewportTransform.y
    );
    
    // Redraw all existing shapes
    this.existingShape.map((shape) => {
        if (shape.type === 'rect') {
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (shape.type === 'line') {
            this.ctx.beginPath();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
        } else if (shape.type === 'pencil') {
            // Draw pencil lines
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
        }
        
    });
}


    updatePanning = (e: MouseEvent) => {
        const localX = e.clientX;
        const localY = e.clientY;

        this.viewportTransform.x += localX - this.previousX;
        this.viewportTransform.y += localY - this.previousY;

        this.previousX = localX;
        this.previousY = localY;
    }


    updateZooming = (e: WheelEvent) => {
        // Prevent extreme zoom levels
        const MIN_SCALE = 0.1;
        const MAX_SCALE = 5;
        const ZOOM_SENSITIVITY = 0.010;

        // Calculate new scale with sensitivity and bounds
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.viewportTransform.scale * (1 + delta)));
        
        // Calculate zoom focus point in world space
        const focusX = (e.clientX - this.viewportTransform.x) / this.viewportTransform.scale;
        const focusY = (e.clientY - this.viewportTransform.y) / this.viewportTransform.scale;
        
        // Update the transform
        this.viewportTransform.x = e.clientX - focusX * newScale;
        this.viewportTransform.y = e.clientY - focusY * newScale;
        this.viewportTransform.scale = newScale;
    }

    onMouseWheel = (e: WheelEvent) => {
        e.preventDefault(); // Prevent default scrolling
        this.canvas.style.cursor = 'zoom-in'; // Change cursor to zoom-in
        this.updateZooming(e);
        this.render();
        this.onMouseLeave();
    }

    onMouseLeave = () => {
        this.canvas.style.cursor = 'default'; // Change cursor back to default
    }

        // this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        // this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        // this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
}
export default Game;