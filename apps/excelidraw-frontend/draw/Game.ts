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
    
    constructor(canvas: HTMLCanvasElement, roomId:string, socket: WebSocket | null, width?: number, height?: number){
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
        
        // Set canvas dimensions - use provided dimensions
        if (width && height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
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
                const receivedShape = parsedData.shape as Shape;

                const existingShapeIndex = this.existingShape.findIndex(s => s.id === receivedShape.id);

                if (existingShapeIndex !== -1) {
                    this.existingShape[existingShapeIndex] = receivedShape;
                    if (this.selectionController.getSelectedShape()?.id === receivedShape.id) {
                        this.selectionController.selectShape(receivedShape);
                    }
                } else {
                    this.existingShape.push(receivedShape);
                }
                
                this.render();
                
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

    if (this.selectedTool === Tool.Selection) {
        const shapeUnderMouse = this.selectionController.findShapeAtPoint(worldX, worldY, this.existingShape);
        
        if (shapeUnderMouse) {
            if (this.selectionController.getSelectedShape() !== shapeUnderMouse) {
                this.selectionController.selectShape(shapeUnderMouse);
            }
            this.selectionController.handleMouseDown(worldX, worldY);
        } else {
            this.selectionController.selectShape(null);
        }
        this.render();

    } else if (this.selectedTool === null) { // Panning mode
        this.canvas.style.cursor = 'grab';
        this.previousX = e.clientX;
        this.previousY = e.clientY;
    } else { // Drawing mode
        this.selectionController.selectShape(null); // Deselect when drawing
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
        this.clicked = false;

        if (this.selectedTool === Tool.Selection) {
            this.selectionController.handleMouseUp();
        } else {
            this.canvas.style.cursor = 'default';
            if (this.selectedTool !== null) { // If we were drawing
                const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);
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
            }
        }
        this.render();
    };     
         

    mouseMoveHandler = (e: MouseEvent) => {
    const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);

    if (this.selectedTool === Tool.Selection) {
        this.selectionController.handleMouseMove(worldX, worldY);
    } else if (this.selectedTool === null) { // Panning mode
        if (this.clicked) {
            this.updatePanning(e);
            this.canvas.style.cursor = 'grabbing';
            this.render();
        }
    } else { // Drawing mode
        if (!this.clicked) return;
        
        this.render(); // Redraw all shapes first

        const width = worldX - this.startX;
        const height = worldY - this.startY;
        
        // Draw the temporary shape being created on top
        this.ctx.strokeStyle = this.strokeColor;

        if (this.selectedTool === Tool.Rectangle) {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === Tool.Line) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(worldX, worldY);
            this.ctx.stroke();
        } else if (this.selectedTool === Tool.Circle) {
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (this.selectedTool === Tool.Pencil) {
            let current = this.existingShape[this.existingShape.length - 1] as any;
            if (current && current.type === Tool.Pencil) {
                current.points.push({ x: worldX, y: worldY });
            }
        }
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

    this.selectionController.drawSelectionUI();
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