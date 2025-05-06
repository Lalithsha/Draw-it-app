"use client";
import { useEffect, useRef, useState } from "react";
import IconButton from "@repo/ui/components/IconButton";
import { Circle, Pencil, Minus, RectangleHorizontal } from "lucide-react";
import { Game } from "../../../draw/Game";

// add enum for shape types : circle, line, pencil
export enum tool {
  Circle = "circle",
  Line = "line",
  Rectangle = "rect",
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
  const [game, setGame] = useState<Game>();
  // const [selectedTool, setSelectedTool] = useState<tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<tool>(tool.Circle);

  useEffect(() => {
    // game?.setTool(selectedTool as tool);
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);
      // initDraw(, shape);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef, roomId, socket]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      />
      {/* <div className=" absolute bottom-0 right-0 flex gap-2 m-2">
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
      </div> */}
      <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </>
  );
}

function TopBar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: tool;
  setSelectedTool: (s: tool) => void;
}) {
  return (
    <div className="top-2 left-2 flex absolute  text-white border border-gray-400 rounded-md shadow-md">
      <IconButton
        activated={selectedTool === "pencil"}
        icon={<Pencil />}
        onClick={() => setSelectedTool(tool.Pencil)}
      />
      <IconButton
        activated={selectedTool === "rect"}
        icon={<RectangleHorizontal />}
        onClick={() => setSelectedTool(tool.Rectangle)}
      />
      <IconButton
        activated={selectedTool === "circle"}
        icon={<Circle />}
        onClick={() => setSelectedTool(tool.Circle)}
      />
      <IconButton
        activated={selectedTool === "line"}
        icon={<Minus />}
        onClick={() => setSelectedTool(tool.Line)}
      />
    </div>
  );
}
