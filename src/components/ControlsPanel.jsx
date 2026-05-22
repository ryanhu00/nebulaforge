import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "./Slider.jsx";
import IconButton from "./IconButton.jsx";
import { formatSeed } from "../lib/seed.js";

const SLIDER_DEFS = [
  { key: "density", label: "Density" },
  { key: "turbulence", label: "Turbulence" },
  { key: "cloudScale", label: "Cloud Scale" },
  { key: "brightness", label: "Brightness" },
  { key: "contrast", label: "Contrast" },
  { key: "saturation", label: "Saturation" },
  { key: "hueShift", label: "Hue Shift" },
  { key: "glowIntensity", label: "Glow Intensity" },
  { key: "starDensity", label: "Star Density" },
  { key: "octaves", label: "Noise Octaves" },
  { key: "animationSpeed", label: "Animation Speed" },
];

export default function ControlsPanel({
  params,
  paramRanges,
  setParam,
  seed,
  newSeed,
  onExport,
  onFullscreen,
  isFullscreen,
  onResetView,
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed top-4 right-4 z-30 h-9 w-9 rounded-md glass text-white/85 hover:text-white flex items-center justify-center"
        aria-label={open ? "Hide controls" : "Show controls"}
        title={open ? "Hide controls" : "Show controls"}
        animate={{ rotate: open ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="panel"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            className="fixed top-0 right-0 z-20 h-full w-[340px] glass shadow-[0_0_60px_rgba(0,0,0,0.5)] border-l border-[var(--color-space-border)] flex flex-col"
          >
            <header className="px-5 pt-5 pb-4 border-b border-[var(--color-space-border)]">
              <div className="pr-12">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-space-muted)]">
                  Observatory
                </div>
                <h1 className="text-[22px] font-medium text-white mt-0.5">
                  NebulaForge
                </h1>
              </div>

              <button
                type="button"
                onClick={newSeed}
                className="mt-4 w-full h-10 rounded-md border border-[var(--color-space-border-strong)] bg-white/[0.04] hover:bg-[var(--color-space-accent)]/15 hover:border-[var(--color-space-accent)] hover:shadow-[0_0_22px_var(--color-space-accent-glow)] transition-all duration-200 flex items-center justify-center gap-2 text-[12px] tracking-[0.18em] uppercase text-white font-medium"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
                Generate
              </button>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-space-muted)]">
                  Seed
                </div>
                <div className="font-[var(--font-mono)] text-[12px] tabular-nums text-white/85">
                  {formatSeed(seed)}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4 space-y-3.5">
              <h2 className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-space-muted)]">
                Parameters
              </h2>
              {SLIDER_DEFS.map((def) => {
                const r = paramRanges[def.key];
                return (
                  <Slider
                    key={def.key}
                    label={def.label}
                    value={params[def.key]}
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    onChange={(v) => setParam(def.key, v)}
                  />
                );
              })}
            </div>

            <footer className="px-5 py-4 border-t border-[var(--color-space-border)] flex items-center gap-2">
              <button
                type="button"
                onClick={onExport}
                className="flex-1 h-9 rounded-md bg-white text-black text-[12px] tracking-[0.06em] font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export PNG
              </button>
              <IconButton title="Reset view" onClick={onResetView}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12a8 8 0 1 1 2.343 5.657M4 12V6m0 6h6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <IconButton
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={onFullscreen}
                active={isFullscreen}
              >
                {isFullscreen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </IconButton>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
