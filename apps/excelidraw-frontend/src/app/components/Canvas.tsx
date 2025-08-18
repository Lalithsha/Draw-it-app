"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
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
  const { theme } = useTheme();
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

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

  // Apply theme colors to the canvas renderer
  useEffect(() => {
    if (!game) return;
    const isDark = theme === "dark";
    const isLight = theme === "light";
    // Default to system dark if unspecified; the Providers set class on html
    const useDark =
      isDark ||
      (!isLight &&
        typeof window !== "undefined" &&
        document.documentElement.classList.contains("dark"));
    game.setRenderColors({
      backgroundColor: useDark ? "rgba(0,0,0)" : "rgba(255,255,255)",
      strokeColor: useDark ? "rgba(255,255,255)" : "rgba(0,0,0)",
    });
  }, [game, theme]);

  // Ensure canvas resizes with window
  useEffect(() => {
    const onResize = () => {
      if (!canvasRef.current) return;
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
      game?.render();
    };
    // Set initial size
    if (typeof window !== "undefined") {
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [game]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
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
    <div className="mt-2 flex rounded-md shadow-md pointer-events-auto cursor-pointer border border-gray-400 bg-black/30 dark:bg-black/30 bg-opacity-30 backdrop-blur-sm">
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
