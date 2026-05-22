import { useRef } from "react";
import { motion } from "framer-motion";
import NebulaCanvas from "./components/NebulaCanvas.jsx";
import ControlsPanel from "./components/ControlsPanel.jsx";
import { useNebulaController } from "./hooks/useNebulaController.js";

export default function App() {
  const containerRef = useRef(null);
  const nebulaCanvasRef = useRef(null);
  const starCanvasRef = useRef(null);

  const controller = useNebulaController({
    containerRef,
    nebulaCanvasRef,
    starCanvasRef,
  });

  return (
    <div className="fixed inset-0 bg-[var(--color-space-bg)] text-white overflow-hidden">
      <NebulaCanvas
        containerRef={containerRef}
        nebulaCanvasRef={nebulaCanvasRef}
        starCanvasRef={starCanvasRef}
        viewRef={controller.viewRef}
        setView={controller.setView}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-4 left-5 z-10 pointer-events-none"
      >
        <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-space-muted)]">
          NebulaForge
        </div>
        <div className="text-[12px] text-white/70 mt-0.5 font-[var(--font-mono)]">
          drag to pan · scroll to zoom · move to drift
        </div>
      </motion.div>

      <ControlsPanel
        params={controller.params}
        paramRanges={controller.paramRanges}
        setParam={controller.setParam}
        seed={controller.seed}
        newSeed={controller.newSeed}
        onExport={controller.exportPNG}
        onFullscreen={controller.toggleFullscreen}
        isFullscreen={controller.isFullscreen}
        onResetView={controller.resetView}
      />
    </div>
  );
}
