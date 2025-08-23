import { ResizeHandle, Shape, Tool } from "../types/canvas";
import Game from "./Game";

interface ShapeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface OriginalShapeProps {
    bounds: ShapeBounds;
    points?: { x: number; y: number }[];
}

export class SelectionController {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private game: Game;

    private selectedShape: Shape | null = null;
    private isDragging: boolean = false;
    private isResizing: boolean = false;

    private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    private activeResizeHandle: ResizeHandle | null = null;
    private originalShapeProps: OriginalShapeProps = { bounds: { x: 0, y: 0, width: 0, height: 0 } };

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, game: Game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;
    }
    
    // --- Public API for Game.ts ---

    public selectShape(shape: Shape | null) {
        this.selectedShape = shape;
        if (!shape) {
            this.resetCursor();
        }
        this.game.render();
    }

    public getSelectedShape(): Shape | null {
        return this.selectedShape;
    }

    public isShapeSelected(): boolean {
        return !!this.selectedShape;
    }

    public handleMouseDown(worldX: number, worldY: number) {
        if (!this.selectedShape) return;

        const bounds = this.getShapeBounds(this.selectedShape);
        const handle = this.getResizeHandleAtPoint(worldX, worldY, bounds);

        if (handle) {
            this.startResizing(worldX, worldY, handle);
        } else if (this.isPointInShape(worldX, worldY, this.selectedShape)) {
            this.startDragging(worldX, worldY);
        }
    }

    public handleMouseMove(worldX: number, worldY: number) {
        if (this.isResizing) {
            this.updateResizing(worldX, worldY);
            this.game.render();
        } else if (this.isDragging) {
            this.updateDragging(worldX, worldY);
            this.game.render();
        } else {
            this.updateCursor(worldX, worldY);
        }
    }

    public handleMouseUp() {
        if (this.isDragging) {
            this.stopDragging();
        }
        if (this.isResizing) {
            this.stopResizing();
        }
    }

    public findShapeAtPoint(worldX: number, worldY: number, shapes: Shape[]): Shape | null {
        // Iterate backwards to select top-most shape
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (this.isPointInShape(worldX, worldY, shapes[i])) {
                return shapes[i];
            }
        }
        return null;
    }
    
    public drawSelectionUI() {
        if (!this.selectedShape) return;
        const bounds = this.getShapeBounds(this.selectedShape);
        this.drawSelectionBox(bounds);
    }

    // --- Dragging ---

    private startDragging(x: number, y: number) {
        if (!this.selectedShape) return;
            this.isDragging = true;
        this.setCursor("grabbing");

        const shapeOrigin = this.getShapeOrigin(this.selectedShape);
        this.dragOffset = { x: x - shapeOrigin.x, y: y - shapeOrigin.y };

        if (this.selectedShape.type === Tool.Pencil && 'points' in this.selectedShape) {
            this.originalShapeProps.points = this.selectedShape.points.map(p => ({ ...p }));
        }
    }

    private updateDragging(x: number, y: number) {
        if (!this.selectedShape) return;
        const newOriginX = x - this.dragOffset.x;
        const newOriginY = y - this.dragOffset.y;
        const oldOrigin = this.getShapeOrigin(this.selectedShape);
        const dx = newOriginX - oldOrigin.x;
        const dy = newOriginY - oldOrigin.y;

        this.translateShape(this.selectedShape, dx, dy);
    }

    private stopDragging() {
        this.isDragging = false;
        this.updateCursorOnSelection();
        if (this.selectedShape) {
            this.game.sendShapeUpdate(this.selectedShape);
        }
        this.originalShapeProps = { bounds: { x: 0, y: 0, width: 0, height: 0 } };
    }

    // --- Resizing ---

    private startResizing(x: number, y: number, handle: ResizeHandle) {
        if (!this.selectedShape) return;
                this.isResizing = true;
                this.activeResizeHandle = handle;
                this.setCursor(handle.cursor);
        
        this.originalShapeProps = {
            bounds: this.getShapeBounds(this.selectedShape),
        };
        if (this.selectedShape.type === Tool.Pencil && 'points' in this.selectedShape) {
            this.originalShapeProps.points = this.selectedShape.points.map(p => ({ ...p }));
        }
    }

    private updateResizing(x: number, y: number) {
        if (!this.selectedShape || !this.activeResizeHandle || !this.originalShapeProps.bounds) return;

        const originalBounds = this.originalShapeProps.bounds;
        let newBounds = { ...originalBounds };

        if (this.activeResizeHandle.position.includes("right")) {
            newBounds.width = x - originalBounds.x;
        }
        if (this.activeResizeHandle.position.includes("left")) {
            newBounds.width = originalBounds.x + originalBounds.width - x;
                    newBounds.x = x;
        }
        if (this.activeResizeHandle.position.includes("bottom")) {
            newBounds.height = y - originalBounds.y;
        }
        if (this.activeResizeHandle.position.includes("top")) {
            newBounds.height = originalBounds.y + originalBounds.height - y;
                    newBounds.y = y;
        }

        if (newBounds.width < 5) newBounds.width = 5;
        if (newBounds.height < 5) newBounds.height = 5;

        this.resizeShape(this.selectedShape, newBounds, originalBounds);
    }

    private stopResizing() {
        this.isResizing = false;
        this.activeResizeHandle = null;
        this.updateCursorOnSelection();
        if (this.selectedShape) {
            this.game.sendShapeUpdate(this.selectedShape);
        }
        this.originalShapeProps = { bounds: { x: 0, y: 0, width: 0, height: 0 } };
    }

    // --- Shape Transformations ---

    private resizeShape(shape: Shape, newBounds: ShapeBounds, originalBounds: ShapeBounds) {
        switch (shape.type) {
            case Tool.Rectangle:
                shape.x = newBounds.x;
                shape.y = newBounds.y;
                shape.width = newBounds.width;
                shape.height = newBounds.height;
                    break;
            case Tool.Circle:
                shape.centerX = newBounds.x + newBounds.width / 2;
                shape.centerY = newBounds.y + newBounds.height / 2;
                shape.radius = Math.min(Math.abs(newBounds.width), Math.abs(newBounds.height)) / 2;
                    break;
            case Tool.Line:
                const handle = this.activeResizeHandle?.position;
                if (handle === 'top-left' || handle === 'bottom-left') {
                    shape.startX = newBounds.x;
                } else {
                    shape.startX = newBounds.x + newBounds.width;
                }
                if (handle === 'top-left' || handle === 'top-right') {
                    shape.startY = newBounds.y;
                } else {
                    shape.startY = newBounds.y + newBounds.height;
                }
                if (handle === 'top-right' || handle === 'bottom-right') {
                    shape.endX = newBounds.x + newBounds.width;
                } else {
                    shape.endX = newBounds.x;
                }
                if (handle === 'bottom-left' || handle === 'bottom-right') {
                    shape.endY = newBounds.y + newBounds.height;
                } else {
                    shape.endY = newBounds.y;
                }
                    break;
                        case Tool.Pencil:
                const sx = originalBounds.width ? newBounds.width / originalBounds.width : 1;
                const sy = originalBounds.height ? newBounds.height / originalBounds.height : 1;
                if (shape.type === Tool.Pencil && this.originalShapeProps.points && 'points' in shape) {
                    shape.points = this.originalShapeProps.points.map(p => ({
                        x: newBounds.x + (p.x - originalBounds.x) * sx,
                        y: newBounds.y + (p.y - originalBounds.y) * sy,
                    }));
                }
                break;
        }
    }

    private translateShape(shape: Shape, dx: number, dy: number) {
        switch (shape.type) {
            case Tool.Rectangle:
                shape.x += dx;
                shape.y += dy;
                break;
            case Tool.Circle:
                shape.centerX += dx;
                shape.centerY += dy;
                break;
            case Tool.Line:
                shape.startX += dx;
                shape.startY += dy;
                shape.endX += dx;
                shape.endY += dy;
                         break;
                        case Tool.Pencil:
                if (shape.type === Tool.Pencil && 'points' in shape) {
                    shape.points.forEach(p => {
                        p.x += dx;
                        p.y += dy;
                    });
                }
                break;
        }
    }

    // --- Hit Detection & Bounds ---

    public isPointInShape(x: number, y: number, shape: Shape): boolean {
        const bounds = this.getShapeBounds(shape);
        // Add a small padding for easier selection
        const padding = 5;
        return x >= bounds.x - padding && x <= bounds.x + bounds.width + padding &&
               y >= bounds.y - padding && y <= bounds.y + bounds.height + padding;
    }

    public getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
        switch (shape.type) {
            case Tool.Rectangle:
                return {
                    x: Math.min(shape.x, shape.x + shape.width),
                    y: Math.min(shape.y, shape.y + shape.height),
                    width: Math.abs(shape.width),
                    height: Math.abs(shape.height)
                };
            case Tool.Circle:
                return {
                    x: shape.centerX - shape.radius,
                    y: shape.centerY - shape.radius,
                    width: 2 * shape.radius,
                    height: 2 * shape.radius
                };
            case Tool.Line:
                return {
                    x: Math.min(shape.startX, shape.endX),
                    y: Math.min(shape.startY, shape.endY),
                    width: Math.abs(shape.startX - shape.endX),
                    height: Math.abs(shape.startY - shape.endY)
                };
            case Tool.Pencil:
                if (shape.type === Tool.Pencil && 'points' in shape) {
                    const points = shape.points;
                    if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
                    let minX = points[0].x, minY = points[0].y, maxX = points[0].x, maxY = points[0].y;
                    for (const p of points) {
                        if (p.x < minX) minX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y > maxY) maxY = p.y;
                    }
                    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                }
                return { x: 0, y: 0, width: 0, height: 0 };
            default:
                return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    private getShapeOrigin(shape: Shape): { x: number, y: number } {
        const bounds = this.getShapeBounds(shape);
        return { x: bounds.x, y: bounds.y };
    }

    // --- UI & Cursors ---

    private drawSelectionBox(bounds: { x: number; y: number; width: number; height: number }) {
        this.ctx.save();
        this.ctx.strokeStyle = "#6965db";
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.ctx.setLineDash([]);

        const handles = this.getResizeHandles(bounds);
        handles.forEach(handle => {
            this.ctx.fillStyle = "#ffffff";
            this.ctx.strokeStyle = "#6965db";
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.rect(handle.x - 4, handle.y - 4, 8, 8);
            this.ctx.fill();
            this.ctx.stroke();
        });
        this.ctx.restore();
    }
    
    private getResizeHandles(bounds: { x: number; y: number; width: number; height: number }): ResizeHandle[] {
        return [
            { x: bounds.x, y: bounds.y, cursor: "nwse-resize", position: "top-left" },
            { x: bounds.x + bounds.width, y: bounds.y, cursor: "nesw-resize", position: "top-right" },
            { x: bounds.x, y: bounds.y + bounds.height, cursor: "nesw-resize", position: "bottom-left" },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: "nwse-resize", position: "bottom-right" }
        ];
    }

    public getResizeHandleAtPoint(x: number, y: number, bounds: { x: number; y: number; width: number; height: number }): ResizeHandle | null {
        const handles = this.getResizeHandles(bounds);
        const handleSize = 12; // A larger click area for handles is better for UX
        for (const handle of handles) {
            if (Math.abs(x - handle.x) < handleSize / 2 && Math.abs(y - handle.y) < handleSize / 2) {
                return handle;
            }
        }
        return null;
    }

    private setCursor(cursor: string) { this.canvas.style.cursor = cursor; }
    private resetCursor() { this.canvas.style.cursor = "default"; }

    private updateCursor(worldX: number, worldY: number) {
        if (this.selectedShape) {
            const bounds = this.getShapeBounds(this.selectedShape);
            const handle = this.getResizeHandleAtPoint(worldX, worldY, bounds);
            if (handle) {
                this.setCursor(handle.cursor);
                return;
            }
            if (this.isPointInShape(worldX, worldY, this.selectedShape)) {
                this.setCursor("move");
                return;
            }
        }
        this.resetCursor();
    }
    
    private updateCursorOnSelection() {
        if (this.selectedShape) {
            this.setCursor("move");
        } else {
            this.resetCursor();
        }
    }
}