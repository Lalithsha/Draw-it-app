// import { Tool } from "@/app/components/Canvas";
import { ResizeHandle, Shape, Tool } from "../types/canvas";
import Game from "./Game";

export class SelectionController{
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private selectedShape: Shape|null = null;

    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragOffset: {x:number, y:number} = {x:0, y:0}
    private dragEndOffset: {x:number, y:number} = {x:0, y:0}
    private activeResizeHandle: ResizeHandle| null = null;

    private originalShapeBounds: {
        x:number;
        y:number;
        width:number;
        height:number;
    } | null = null;
    
    private originalPencilPoints: { x: number; y: number }[] | null = null;
    
    private game:  Game;
    
    private setCursor(cursor: string) {
        this.canvas.style.cursor = cursor;
    }

    private resetCursor() {
        this.canvas.style.cursor = "";
    }

    constructor(canvas: HTMLCanvasElement, ctx:CanvasRenderingContext2D, game: Game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;
        // this.originalShapeBounds = {x:0, y:0, width:0, height:0};
    }
    
    getSelectedShape():Shape|null{
        return this.selectedShape;
    }

    setSelectedShape(shape: Shape|null){
        this.selectedShape = shape;
    }

    // isSelectedShaped():boolean{
    //     return this.selectedShape !==null;
    // }

     isShapeSelected(): boolean {
        return this.selectedShape !== null;
    }

    
    isDraggingShape(): boolean {
        return this.isDragging;
    }

    isResizingShape(): boolean {
        return this.isResizing;
    }


    getShapeBounds(shape: Shape):{x:number, y:number, width:number, height:number} {
        switch(shape.type){
            case Tool.Rectangle:
                const left = shape.width < 0 ? shape.x + shape.width: shape.x;
                const top = shape.height < 0 ? shape.y + shape.height:shape.y;
                return {x:left, y:top, width:Math.abs(shape.width), height:Math.abs(shape.height)};

             case Tool.Circle:
                return {
                    x: shape.centerX-shape.radius, 
                    y: shape.centerY-shape.radius,
                    width: 2 * shape.radius,
                    height: 2 * shape.radius
                }   

            case Tool.Line:  
                const minX = Math.min(shape.startX, shape.endX);
                const minY = Math.min(shape.startY, shape.endY);
                const maxX = Math.max(shape.startX, shape.endX);
                const maxY = Math.max(shape.startY, shape.endY);
                 const padding = 5;
                 return {
                     x: minX - padding,
                     y: minY - padding,
                     width: maxX - minX + 2 * padding, 
                     height: maxY - minY + 2 * padding
                 }
            case Tool.Pencil:
                const pencilPoints = (shape as unknown as { points: { x: number; y: number }[] }).points;
                if (!pencilPoints || pencilPoints.length === 0) {
                    return { x: 0, y: 0, width: 0, height: 0 };
                }
                const minPx = Math.min(...pencilPoints.map(p => p.x));
                const minPy = Math.min(...pencilPoints.map(p => p.y));
                const maxPx = Math.max(...pencilPoints.map(p => p.x));
                const maxPy = Math.max(...pencilPoints.map(p => p.y));
                const pencilPadding = 5;
                return {
                    x: minPx - pencilPadding,
                    y: minPy - pencilPadding,
                    width: maxPx - minPx + 2 * pencilPadding,
                    height: maxPy - minPy + 2 * pencilPadding
                };
            default:
                return {x:0, y:0, width:0, height:0};    
        }
    }
    
    /** Check if a point is within a shape's bounds */
    isPointInShape(x:number, y: number, shape: Shape):boolean{
        const bounds = this.getShapeBounds(shape);
        return x>= bounds.x && x<=bounds.x + bounds.width && y>= bounds.y && y<=bounds.y + bounds.height;
    }
    
     /** Get resize handles for the bounding box */
     private getResizeHandles(bounds:{x:number, y:number, width:number, height:number}): ResizeHandle[]{
        return [
            {x:bounds.x, y: bounds.y, cursor:"nw-resize", position:"top-left"},
            {x:bounds.x + bounds.width, y:bounds.y, cursor:"ne-resize", position:"top-right"},
            {x:bounds.x, y:bounds.y + bounds.height, cursor: "sw-resize",position:"bottom-left"},
            {x:bounds.x + bounds.width, y:bounds.y + bounds.height, cursor:"se-resize", position:"bottom-right"}
        ]
    }

    getResizeHandleAtPoint(x:number, y:number, bounds:{x:number, y:number, width:number, height:number}):ResizeHandle|null{

        const handles = this.getResizeHandles(bounds);
        const handleSize = 10;
        for(const handle of handles){
            if(Math.abs(x - handle.x) < handleSize / 2 && Math.abs(y-handle.y) < handleSize / 2 ){
                return handle;
            }
        }
        return null;
    }
    
    /** Start dragging a shape */
    startDragging(x:number, y:number){
        if(this.selectedShape){
            this.isDragging = true;
            if(this.selectedShape.type === Tool.Rectangle){
                this.dragOffset = {x: x - this.selectedShape.x, y: y- this.selectedShape.y};
            }
            else if(this.selectedShape.type === Tool.Circle) {
                this.dragOffset = {x: x - this.selectedShape.centerX, y: y - this.selectedShape.centerY}
            }
            else if(this.selectedShape.type === Tool.Line){
                this.dragOffset = {x: x - this.selectedShape.startX, y: y - this.selectedShape.startY}
                this.dragEndOffset={x:x-this.selectedShape.endX, y:y-this.selectedShape.endY};
            }
            else if(this.selectedShape.type === Tool.Pencil){
                this.dragOffset = { x, y };
                this.originalPencilPoints = (this.selectedShape as { points: {x:number;y:number}[] }).points.map(p => ({ ...p }));
            }
             this.setCursor("move");
         }
     }

     /** Update shape position while dragging */
     updateDragging(x:number, y:number){
        if(this.isDragging && this.selectedShape){
            if(this.selectedShape.type === Tool.Rectangle){
                this.selectedShape.x = x-this.dragOffset.x;
                this.selectedShape.y = y-this.dragOffset.y;
            }
            else if(this.selectedShape.type === Tool.Circle){
                this.selectedShape.centerX = x - this.dragOffset.x;
                this.selectedShape.centerY = y - this.dragOffset.y;
            }
            else if(this.selectedShape.type === Tool.Line){
                 this.selectedShape.startX = x - this.dragOffset.x;
                 this.selectedShape.startY = y - this.dragOffset.y;
                 this.selectedShape.endX = x - this.dragEndOffset.x;
                 this.selectedShape.endY = y - this.dragEndOffset.y;
             }
            else if(this.selectedShape.type === Tool.Pencil && this.originalPencilPoints){
                const dx = x - this.dragOffset.x;
                const dy = y - this.dragOffset.y;
                const pts = (this.selectedShape as unknown as { points: {x:number;y:number}[] }).points;
                for (let i = 0; i < pts.length; i++) {
                    pts[i].x = this.originalPencilPoints[i].x + dx;
                    pts[i].y = this.originalPencilPoints[i].y + dy;
                }
            }
         }
     }

     /* Stop dragging */
    stopDragging(){
        this.isDragging = false;
        this.resetCursor();
        if (this.selectedShape) { // Check if a shape is selected
            this.game.sendShapeUpdate(this.selectedShape); // Call the new method in Game
        }
        this.originalPencilPoints = null;
    }
    

    startResizing(x:number, y:number){
        if(this.selectedShape){
            const bounds = this.getShapeBounds(this.selectedShape);
            const handle = this.getResizeHandleAtPoint(x,y, bounds);
            if(handle){
                this.isResizing = true;
                this.activeResizeHandle = handle;
                this.originalShapeBounds={...bounds};
                if (this.selectedShape.type === Tool.Pencil) {
                    this.originalPencilPoints = (this.selectedShape as { points: {x:number;y:number}[] }).points.map(p => ({ ...p }));
                }
                this.setCursor(handle.cursor);
            }
        }
    }

     /** Update shape size while resizing */
    updateResizing(x: number, y: number) {
        if (this.isResizing && this.selectedShape && this.activeResizeHandle && this.originalShapeBounds) {
            const newBounds = { ...this.originalShapeBounds };
            switch (this.activeResizeHandle.position) {
                case "top-left":
                    newBounds.width += newBounds.x - x;
                    newBounds.height += newBounds.y - y;
                    newBounds.x = x;
                    newBounds.y = y;
                    break;
                case "top-right":
                    newBounds.width = x - newBounds.x;
                    newBounds.height += newBounds.y - y;
                    newBounds.y = y;
                    break;
                case "bottom-left":
                    newBounds.width += newBounds.x - x;
                    newBounds.height = y - newBounds.y;
                    newBounds.x = x;
                    break;
                case "bottom-right":
                    newBounds.width = x - newBounds.x;
                    newBounds.height = y - newBounds.y;
                    break;
            }

            if (this.selectedShape.type === Tool.Rectangle) {
                this.selectedShape.x = newBounds.x;
                this.selectedShape.y = newBounds.y;
                this.selectedShape.width = newBounds.width;
                this.selectedShape.height = newBounds.height;
            } else if (this.selectedShape.type === Tool.Circle) {
                const centerX = newBounds.x + newBounds.width / 2;
                const centerY = newBounds.y + newBounds.height / 2;
                this.selectedShape.centerX = centerX;
                this.selectedShape.centerY = centerY;
                this.selectedShape.radius = Math.min(newBounds.width, newBounds.height) / 2;
            } else if (this.selectedShape.type === Tool.Line) {
                 switch (this.activeResizeHandle.position) {
                     case "top-left":
                         this.selectedShape.startX = x;
                         this.selectedShape.startY = y;
                         break;
                     case "bottom-right":
                         this.selectedShape.endX = x;
                         this.selectedShape.endY = y;
                         break;
                     // Add "top-right" and "bottom-left" if needed
                 }
            } else if (this.selectedShape.type === Tool.Pencil && this.originalPencilPoints && this.originalShapeBounds) {
                // scale pencil points to fit new bounds
                const ob = this.originalShapeBounds;
                const sx = ob.width !== 0 ? (newBounds.width / ob.width) : 1;
                const sy = ob.height !== 0 ? (newBounds.height / ob.height) : 1;
                const pts = (this.selectedShape as { points: {x:number;y:number}[] }).points;
                for (let i = 0; i < pts.length; i++) {
                    const px = this.originalPencilPoints[i].x;
                    const py = this.originalPencilPoints[i].y;
                    pts[i].x = newBounds.x + (px - ob.x) * sx;
                    pts[i].y = newBounds.y + (py - ob.y) * sy;
                }
            }
         }
     }

     /** Stop resizing */
    stopResizing() {
        this.isResizing = false;
        this.activeResizeHandle = null;
        this.originalShapeBounds = null;
        this.resetCursor();
        if (this.selectedShape) { // Check if a shape is selected
            this.game.sendShapeUpdate(this.selectedShape); // Call the new method in Game
        }
        this.originalPencilPoints = null;
    }

    /** Draw the selection box with resize handles */
    drawSelectionBox(bounds: { x: number; y: number; width: number; height: number }) {
        this.ctx.save();
        this.ctx.strokeStyle = "#6965db"; // Selection box color
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const handles = this.getResizeHandles(bounds);
        handles.forEach(handle => {
            this.ctx.fillStyle = "#ffffff"; // Handle fill
            this.ctx.strokeStyle = "#6965db"; // Handle border
            this.ctx.beginPath();
            this.ctx.rect(handle.x - 5, handle.y - 5, 10, 10);
            this.ctx.fill();
            this.ctx.stroke();
        });
        this.ctx.restore();
    }
    
}

