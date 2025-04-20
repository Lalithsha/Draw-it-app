import { useEffect, useRef } from "react";
import initDraw from "../../../draw";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current, roomId, socket);
    }
    // return () => {
    //   canvas.removeEventListener("mousedown", handleMouseDown);
    //   canvas.removeEventListener("mouseup", handleMouseUp);
    //   canvas.removeEventListener("mousemove", handleMouseMove);
    // };
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={1534}
      height={693}
      style={{ border: "1px solid black" }}
    ></canvas>
  );
}
