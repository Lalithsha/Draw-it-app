import { Tool } from "../types/canvas";
import { getExistingShapes, postShape } from "./http";
import { SelectionController } from "./SelectionController";
import { Shape } from "../types/canvas";
import { v4 as uuidv4 } from 'uuid';

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

    private selectedTool:Tool|null = null;

    // Theme-aware render colors
    private backgroundColor: string = "rgba(0, 0, 0)";
    private strokeColor: string = "rgba(255, 255, 255)";
    
    socket: WebSocket | null;
    
    private selectionController: SelectionController;
    
    constructor(canvas: HTMLCanvasElement, roomId:string, socket: WebSocket | null){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.existingShape = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.selectionController = new SelectionController(this.canvas, this.ctx, this); // Add this line
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

    setTool(tool: Tool | null){
        this.selectedTool = tool;
        console.log("set tool as ", this.selectedTool)
    }

    /** Configure colors for light/dark theme */
    setRenderColors(colors: { backgroundColor: string; strokeColor: string }) {
        this.backgroundColor = colors.backgroundColor;
        this.strokeColor = colors.strokeColor;
        this.render();
    }
    
    initHandlers(){
        if (!this.socket) return;
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'STREAM_SHAPE' || message.type === 'chat') {
                const parsedData = JSON.parse(message.message);
                this.existingShape.push(parsedData.shape);
                this.clearCanvas();
                
                // Send acknowledgment if messageId exists
                if (message.messageId) {
                    this.socket?.send(JSON.stringify({
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
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
        this.existingShape.map((shape)=>{
            if(shape.type===Tool.Rectangle){
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            else if(shape.type === Tool.Circle){
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke(); // Added stroke for circle outline
                this.ctx.closePath();
            }
            else if(shape.type === Tool.Line){
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.moveTo(shape.startX, shape.startY); 
                this.ctx.lineTo(shape.endX, shape.endY); // Example line length
                // this.ctx.lineTo(shape.centerX, shape.y); // Example line length
                this.ctx.stroke();
            }
            else if(shape.type === Tool.Pencil){
                const pts: { x:number; y:number }[] = (shape as unknown as { points: {x:number;y:number}[] }).points;
                if (pts && pts.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.strokeColor;
                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';
                    this.ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) {
                        this.ctx.lineTo(pts[i].x, pts[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
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

    mouseDownHandler = (e: MouseEvent) => {
    this.clicked = true;
    const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);
    console.log("mouse down selected tool is ", this.selectedTool)
    if (this.selectedTool === Tool.Selection) {
        let shapeClicked = false;
        for (let i = this.existingShape.length - 1; i >= 0; i--) {
            const shape = this.existingShape[i];
            if (this.selectionController.isPointInShape(worldX, worldY, shape)) {
                this.selectionController.setSelectedShape(shape);
                shapeClicked = true;
                const bounds = this.selectionController.getShapeBounds(shape);
                const handle = this.selectionController.getResizeHandleAtPoint(worldX, worldY, bounds);
                if (handle) {
                    this.selectionController.startResizing(worldX, worldY);
                } else {
                    this.selectionController.startDragging(worldX, worldY);
                }
                break;
            }
        }
        if (!shapeClicked) {
            this.selectionController.setSelectedShape(null);
        }
        this.render();
    } else if (this.selectedTool === null) { // Panning mode
        this.canvas.style.cursor = 'grab';
        this.previousX = e.clientX;
        this.previousY = e.clientY;
    } else { // Drawing mode
        console.log("Mouse down for tools")
        this.startX = worldX;
        this.startY = worldY;
        this.previousX = e.clientX;
        this.previousY = e.clientY;
        if (this.selectedTool === Tool.Pencil) {
            const pencil: Shape = { id: uuidv4(), type: Tool.Pencil, points: [{ x: worldX, y: worldY }] } as unknown as Shape;
            this.existingShape.push(pencil);
        }
    }
};
    

    mouseUpHandler = (e: MouseEvent) => {
            
    if (!this.clicked) return;
    console.log("Mouse up event happened")
    this.clicked = false;
    this.canvas.style.cursor = 'default';
    const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);
    console.log("selected tool from mouse up handler ", this.selectedTool)
    if (this.selectedTool === Tool.Selection) {
        this.selectionController.stopDragging();
        this.selectionController.stopResizing();
        this.render();
    } else if (this.selectedTool === null) {
        // Panning mode ends; no action needed
    } else { // Drawing mode
        const width = worldX - this.startX;
        const height = worldY - this.startY;
        let shape: Shape | null = null;

        if (this.selectedTool === Tool.Line) {
            shape = {
                id: uuidv4(),
                type: Tool.Line,
                startX: this.startX,
                startY: this.startY,
                endX: worldX,
                endY: worldY
            };
        } else if (this.selectedTool === Tool.Rectangle) {
            shape = {
                id: uuidv4(),
                type: Tool.Rectangle,
                x: this.startX,
                y: this.startY,
                width,
                height
            };
        } else if (this.selectedTool === Tool.Circle) {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                id: uuidv4(),
                type: Tool.Circle,
                centerX: this.startX + width / 2,
                centerY: this.startY + height / 2,
                radius: radius
            };
        } else if (this.selectedTool === Tool.Pencil) {
            // finalize current pencil: push final payload
            const current = this.existingShape[this.existingShape.length - 1];
            if (current && current.type === Tool.Pencil) {
                const payload = JSON.stringify({ shape: current });
                if (this.socket) {
                    this.socket.send(JSON.stringify({ type: "STREAM_SHAPE", message: payload, roomId: this.roomId }));
                } else {
                    postShape(this.roomId, payload);
                }
            }
        }

        if (shape) {
            this.existingShape.push(shape);
            const payload = JSON.stringify({ shape });
            if (this.socket) {
                this.socket.send(JSON.stringify({ type: "STREAM_SHAPE", message: payload, roomId: this.roomId }));
            } else {
                postShape(this.roomId, payload);
            }
        }
        this.render();
    }
};     
         

    mouseMoveHandler = (e: MouseEvent) => {
    console.log("Mouse move event happening")    
    if (!this.clicked) return;
    const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);

    if (this.selectedTool === Tool.Selection) {
        if (this.selectionController.isDraggingShape()) {
            this.selectionController.updateDragging(worldX, worldY);
            this.render();
        } else if (this.selectionController.isResizingShape()) {
            this.selectionController.updateResizing(worldX, worldY);
            this.render();
        }
    } else if (this.selectedTool === null) { // Panning mode
        this.updatePanning(e);
        this.canvas.style.cursor = 'grabbing';
        this.render();
    } else { // Drawing mode
        const width = worldX - this.startX;
        const height = worldY - this.startY;
        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)";

        if (this.selectedTool === Tool.Rectangle) {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === Tool.Line) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(worldX, worldY);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === Tool.Circle) {
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === Tool.Pencil) {
            // Throttled point append for current stroke
            let current = this.existingShape[this.existingShape.length - 1] as Shape | undefined;
            if (!current || current.type !== Tool.Pencil) {
                const pencil = { id: uuidv4(), type: Tool.Pencil, points: [{ x: this.startX, y: this.startY }] } as unknown as Shape;
                this.existingShape.push(pencil);
                current = pencil;
            }
            (current as unknown as { points: {x:number;y:number}[] }).points.push({ x: worldX, y: worldY });
            // Send incremental updates in batches: only every N points
            const pts = (current as unknown as { points: { x: number; y: number }[] }).points;
            if (pts.length % 5 === 0) {
                const payload = JSON.stringify({ shape: current });
                if (this.socket) {
                    this.socket.send(JSON.stringify({ type: "STREAM_SHAPE", message: payload, roomId: this.roomId }));
                } else {
                    postShape(this.roomId, payload);
                }
            }
        }
        this.render();
    }
};
    
    
    initMouseHandlers(){
        // Remove any existing handlers first
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.onMouseWheel);
        
        // Add handlers
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        console.log("Mouse down handler added");
        
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        console.log("Mouse up handler added");
        
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        console.log("Mouse move handler added");

        this.canvas.addEventListener("mouseleave", ()=>{
            if(this.clicked){
                this.clicked = false;
                this.render();
            }
        });

        this.canvas.addEventListener("wheel", this.onMouseWheel);
    }

    destroy(){       
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("wheel", this.onMouseWheel);
    }

    render = () => {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.setTransform(
        this.viewportTransform.scale,
        0,
        0,
        this.viewportTransform.scale,
        this.viewportTransform.x,
        this.viewportTransform.y
    );

    this.existingShape.forEach((shape) => {
        this.ctx.strokeStyle = this.strokeColor;
        if (shape.type === Tool.Rectangle) {
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === Tool.Circle) {
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (shape.type === Tool.Line) {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
        } else if (shape.type === Tool.Pencil) {
            const pts: { x:number; y:number }[] = (shape as unknown as { points: {x:number;y:number}[] }).points;
            if (pts && pts.length > 1) {
                this.ctx.beginPath();
                this.ctx.lineCap = "round";
                this.ctx.lineJoin = "round";
                this.ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) this.ctx.lineTo(pts[i].x, pts[i].y);
                this.ctx.stroke();
            }
        }
    });

    if (this.selectionController.isShapeSelected()) {
        const selectedShape = this.selectionController.getSelectedShape();
        if (selectedShape) {
            const bounds = this.selectionController.getShapeBounds(selectedShape);
            this.selectionController.drawSelectionBox(bounds);
        }
    }
};


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
    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = screenX - rect.left;
        const clientY = screenY - rect.top;
        return {
            x: (clientX - this.viewportTransform.x) / this.viewportTransform.scale,
            y: (clientY - this.viewportTransform.y) / this.viewportTransform.scale
        };
    }

 sendShapeUpdate(shape: Shape) {
        const payload = JSON.stringify({ shape });
        if (this.socket) {
            this.socket.send(JSON.stringify({ type: "STREAM_SHAPE", message: payload, roomId: this.roomId }));
        } else {
            postShape(this.roomId, payload);
        }
    }


}
export default Game;