"use client";
import { useEffect, useRef, useState } from "react";
import initDraw from "../../../draw";
import IconButton from "@repo/ui/components/IconButton";
import {
  Circle,
  Pencil,
  RectangleEllipsisIcon,
  RectangleHorizontal,
} from "lucide-react";

// add enum for shape types : circle, line, pencil
export enum ShapeType {
  Circle = "circle",
  Line = "line",
  Rectangle = "rectangle",
  Pencil = "pencil",
}

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState("");
  const [selectedTool, setSelectedTool] = useState<ShapeType>(ShapeType.Circle);

  const handleShapeChange = (newShape: string) => () => {
    setShape(newShape);
  };

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current, roomId, socket, shape);
    }
  }, [canvasRef, shape]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ border: "1px solid black" }}
      />
      <div className=" absolute bottom-0 right-0 flex gap-2 m-2">
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={handleShapeChange("circle")}
        >
          Circle
        </button>
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={handleShapeChange("line")}
        >
          Line
        </button>
        <button
          className="bg-green-500 text-white p-2 rounded"
          onClick={handleShapeChange("rectangle")}
        >
          Rectangle
        </button>
      </div>
      <div className="bg-white text-black flex flex-row justify-center items-center h-screen w-screen">
        hello world
      </div>
      <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </>
  );
}

function TopBar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: ShapeType;
  setSelectedTool: (s: ShapeType) => void;
}) {
  return (
    <div className="top-2 left-2 flex absolute  text-white border border-gray-400 rounded-md shadow-md">
      <IconButton
        activated={selectedTool === "pencil"}
        icon={<Pencil />}
        onClick={() => setSelectedTool(ShapeType.Pencil)}
      />
      <IconButton
        activated={selectedTool === "rectangle"}
        icon={<RectangleHorizontal />}
        onClick={() => setSelectedTool(ShapeType.Rectangle)}
      />
      <IconButton
        activated={selectedTool === "circle"}
        icon={<Circle />}
        onClick={() => setSelectedTool(ShapeType.Circle)}
      />
    </div>
  );
}
