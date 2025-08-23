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
import { useIsClient, useWindowDimensions } from "../hooks/use-client";

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
  const isClient = useIsClient();
  const { width: canvasWidth, height: canvasHeight } = useWindowDimensions();

  useEffect(() => {
    if (game) {
      console.log("Setting tool:", selectedTool);
      game.setTool(selectedTool);
    }
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current && isClient && canvasWidth > 0 && canvasHeight > 0) {
      const g = new Game(
        canvasRef.current,
        roomId,
        socket ?? null,
        canvasWidth,
        canvasHeight
      );
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [roomId, socket, canvasWidth, canvasHeight, isClient]);

  // Apply theme colors to the canvas renderer
  useEffect(() => {
    if (!game || !isClient) return;
    const isDark = theme === "dark";
    const isLight = theme === "light";
    // Default to system dark if unspecified; the Providers set class on html
    const useDark =
      isDark ||
      (!isLight && document.documentElement.classList.contains("dark"));
    game.setRenderColors({
      backgroundColor: useDark ? "rgba(0,0,0)" : "rgba(255,255,255)",
      strokeColor: useDark ? "rgba(255,255,255)" : "rgba(0,0,0)",
    });
  }, [game, theme, isClient]);

  // Trigger game render when dimensions change
  useEffect(() => {
    if (game && isClient) {
      game.render();
    }
  }, [canvasWidth, canvasHeight, game, isClient]);

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
        icon={<MousePointer />}
        onClick={() => setSelectedTool(Tool.Selection)}
        activated={selectedTool === Tool.Selection}
        tooltip="Selection"
      />
      <IconButton
        icon={<Pencil />}
        onClick={() => setSelectedTool(Tool.Pencil)}
        activated={selectedTool === Tool.Pencil}
        tooltip="Pencil"
      />
      <IconButton
        icon={<RectangleHorizontal />}
        onClick={() => setSelectedTool(Tool.Rectangle)}
        activated={selectedTool === Tool.Rectangle}
        tooltip="Rectangle"
      />
      <IconButton
        icon={<Circle />}
        onClick={() => setSelectedTool(Tool.Circle)}
        activated={selectedTool === Tool.Circle}
        tooltip="Circle"
      />
      <IconButton
        icon={<Minus />}
        onClick={() => setSelectedTool(Tool.Line)}
        activated={selectedTool === Tool.Line}
        tooltip="Line"
      />
    </div>
  );
}
