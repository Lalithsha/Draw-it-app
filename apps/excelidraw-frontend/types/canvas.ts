// add enum for shape types : circle, line, pencil
export enum Tool {
  Circle = "circle",
  Line = "line",
  Rectangle = "rect",
  Pencil = "pencil",
  Selection = "selection",
}

export type Shape = {
    id: string;
    type: Tool.Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    id: string;
    type: Tool.Circle;
    centerX: number;
    centerY: number;
    radius: number;
} | {
    id: string;
    type: Tool.Line;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    id: string;
    type: Tool.Pencil;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

export interface ResizeHandle{
    x:number;
    y:number;
    cursor:string;
    position:"top-left"|"top-right"|"bottom-left"|"bottom-right";
}
