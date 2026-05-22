import { usePointerNav } from "../hooks/usePointerNav.js";

export default function NebulaCanvas({
  containerRef,
  nebulaCanvasRef,
  starCanvasRef,
  viewRef,
  setView,
}) {
  usePointerNav({ targetRef: containerRef, viewRef, setView });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black select-none touch-none"
    >
      <canvas
        ref={nebulaCanvasRef}
        className="absolute inset-0 w-full h-full block"
      />
      <canvas
        ref={starCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none origin-center will-change-transform"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
