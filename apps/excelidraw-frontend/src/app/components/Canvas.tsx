"use client";
import { useEffect, useRef, useState } from "react";
import IconButton from "@repo/ui/components/IconButton";
import {
  Circle,
  Pencil,
  Minus,
  RectangleHorizontal,
  MousePointer,
} from "lucide-react";
import { Game } from "../../../draw/Game";
import { Tool } from "../../../types/canvas";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (game) {
      console.log("Setting tool:", selectedTool);
      game.setTool(selectedTool);
    }
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket ?? null);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [roomId, socket]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute top-0 left-0 z-0"
      />
      <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
        <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      </div>
    </div>
  );
}

function TopBar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool | null;
  setSelectedTool: (s: Tool | null) => void;
}) {
  return (
    <div className="mt-2 flex border border-gray-400 rounded-md shadow-md bg-black/30 pointer-events-auto cursor-pointer ">
      <IconButton
        activated={selectedTool === Tool.Selection}
        icon={<MousePointer />}
        onClick={() => setSelectedTool(Tool.Selection)}
      />
      <IconButton
        activated={selectedTool === Tool.Pencil}
        icon={<Pencil />}
        onClick={() => setSelectedTool(Tool.Pencil)}
      />
      <IconButton
        activated={selectedTool === Tool.Rectangle}
        icon={<RectangleHorizontal />}
        onClick={() => setSelectedTool(Tool.Rectangle)}
      />
      <IconButton
        activated={selectedTool === Tool.Circle}
        icon={<Circle />}
        onClick={() => setSelectedTool(Tool.Circle)}
      />
      <IconButton
        activated={selectedTool === Tool.Line}
        icon={<Minus />}
        onClick={() => setSelectedTool(Tool.Line)}
      />
    </div>
  );
}
