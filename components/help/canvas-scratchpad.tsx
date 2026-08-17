"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function CanvasScratchpad({
  onCheckWork,
  checking,
}: {
  onCheckWork: (dataUrl: string) => void;
  checking: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getContext(): CanvasRenderingContext2D | null {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getContext();
    if (!ctx) return;
    drawing.current = true;
    setHasDrawn(true);
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2C2620";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function checkWork() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCheckWork(canvas.toDataURL("image/png"));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <canvas
        ref={canvasRef}
        width={340}
        height={220}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full touch-none rounded-2xl border-[1.5px] border-line bg-card"
      />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={clearCanvas} disabled={!hasDrawn}>
          Clear
        </Button>
        <Button className="flex-1" onClick={checkWork} disabled={!hasDrawn || checking}>
          {checking ? "Reading your work…" : "Check My Work"}
        </Button>
      </div>
    </div>
  );
}
