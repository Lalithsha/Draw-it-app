"use client";
import { useEffect, useRef } from "react";
import initDraw from "../../../../draw";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current);
    }

    // return () => {
    //   canvas.removeEventListener("mousedown", handleMouseDown);
    //   canvas.removeEventListener("mouseup", handleMouseUp);
    //   canvas.removeEventListener("mousemove", handleMouseMove);
    // };
  }, [canvasRef]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={1534}
        height={693}
        style={{ border: "1px solid black" }}
      ></canvas>
      <div className="absolute bottom-0 right-0">
        <button className="bg-white text-black m-2 p-2 rounded-md">
          Rectangle
        </button>
        <button className="bg-white text-black m-2 p-2 rounded-md">
          Circle
        </button>
      </div>
    </div>
  );
}
