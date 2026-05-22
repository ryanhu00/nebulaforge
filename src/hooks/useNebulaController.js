import { useCallback, useEffect, useRef, useState } from "react";
import { createNebulaRenderer } from "../lib/nebulaRenderer.js";
import { createStarRenderer } from "../lib/starRenderer.js";
import { generatePalette } from "../lib/palettes.js";
import { mulberry32, randomSeed, formatSeed } from "../lib/seed.js";

export const DEFAULT_PARAMS = {
  density: 1.0,
  turbulence: 2.1,
  cloudScale: 1.2,
  brightness: 1.05,
  contrast: 1.15,
  saturation: 1.1,
  hueShift: 0,
  glowIntensity: 0.75,
  starDensity: 1200,
  octaves: 5,
  animationSpeed: 0.45,
};

export const PARAM_RANGES = {
  density: { min: 0.4, max: 2.0, step: 0.01 },
  turbulence: { min: 1.5, max: 3.0, step: 0.01 },
  cloudScale: { min: 0.4, max: 4.0, step: 0.01 },
  brightness: { min: 0.5, max: 2.0, step: 0.01 },
  contrast: { min: 0.6, max: 2.0, step: 0.01 },
  saturation: { min: 0.0, max: 2.0, step: 0.01 },
  hueShift: { min: -0.5, max: 0.5, step: 0.005 },
  glowIntensity: { min: 0.0, max: 1.5, step: 0.01 },
  starDensity: { min: 200, max: 4000, step: 10 },
  octaves: { min: 2, max: 8, step: 1 },
  animationSpeed: { min: 0.0, max: 2.0, step: 0.01 },
};

function seedToOffsets(seed) {
  const rng = mulberry32(seed >>> 0);
  return [rng() * 1000 - 500, rng() * 1000 - 500];
}

// View state convention:
// - panPxX/Y are accumulated drag deltas in CSS pixels.
// - parallaxPxX/Y are smoothed mouse-parallax offsets in CSS pixels.
// - The nebula shader receives uCamera in shader units (= pixels / containerHeight / zoom),
//   so panning by N pixels shifts the rendered image by exactly N pixels regardless of zoom.
// - The star canvas receives a CSS translate(panPx + starParallax) and scale(zoom);
//   stars and nebula lock together under drag and float at a shallower depth under parallax.
function makeView() {
  return {
    zoom: 1.0,
    panPxX: 0,
    panPxY: 0,
    parallaxPxX: 0,
    parallaxPxY: 0,
    targetParallaxPxX: 0,
    targetParallaxPxY: 0,
    starParallaxPxX: 0,
    starParallaxPxY: 0,
  };
}

export function useNebulaController({ nebulaCanvasRef, starCanvasRef, containerRef }) {
  const [seed, setSeed] = useState(() => randomSeed());
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const paramsRef = useRef(params);
  const seedRef = useRef(seed);
  // Palette is fully derived from the seed — every Generate produces a
  // fresh multi-hue palette that blends across the nebula.
  const paletteRef = useRef(generatePalette(seed));
  const seedOffsetsRef = useRef(seedToOffsets(seed));
  const viewRef = useRef(makeView());
  const timeRef = useRef(0);
  const lastTickRef = useRef(0);

  const nebulaRendererRef = useRef(null);
  const starRendererRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    seedRef.current = seed;
    seedOffsetsRef.current = seedToOffsets(seed);
    paletteRef.current = generatePalette(seed);
  }, [seed]);

  useEffect(() => {
    const nebulaCanvas = nebulaCanvasRef.current;
    const starCanvas = starCanvasRef.current;
    const container = containerRef.current;
    if (!nebulaCanvas || !starCanvas || !container) return undefined;

    const nebula = createNebulaRenderer(nebulaCanvas);
    const stars = createStarRenderer(starCanvas);
    nebulaRendererRef.current = nebula;
    starRendererRef.current = stars;

    function applyResize() {
      const rect = container.getBoundingClientRect();
      nebula.resize(rect.width, rect.height);
      stars.resize(rect.width, rect.height);
      stars.generate(seedRef.current, paramsRef.current.starDensity);
      stars.draw();
    }
    applyResize();

    const ro = new ResizeObserver(applyResize);
    ro.observe(container);

    function tick(now) {
      if (!lastTickRef.current) lastTickRef.current = now;
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      const p = paramsRef.current;
      timeRef.current += dt * p.animationSpeed;

      const v = viewRef.current;
      const lerp = 1 - Math.pow(0.001, dt);
      v.parallaxPxX += (v.targetParallaxPxX - v.parallaxPxX) * lerp;
      v.parallaxPxY += (v.targetParallaxPxY - v.parallaxPxY) * lerp;
      v.starParallaxPxX +=
        (v.targetParallaxPxX * 0.45 - v.starParallaxPxX) * lerp;
      v.starParallaxPxY +=
        (v.targetParallaxPxY * 0.45 - v.starParallaxPxY) * lerp;

      const h = Math.max(container.clientHeight, 1);
      const totalPxX = v.panPxX + v.parallaxPxX;
      const totalPxY = v.panPxY + v.parallaxPxY;

      starCanvas.style.transform = `translate3d(${
        v.panPxX + v.starParallaxPxX
      }px, ${v.panPxY + v.starParallaxPxY}px, 0) scale(${v.zoom})`;

      const cameraX = -totalPxX / h / v.zoom;
      const cameraY = totalPxY / h / v.zoom;

      const [sx, sy] = seedOffsetsRef.current;
      nebula.render(
        {
          seedX: sx,
          seedY: sy,
          density: p.density,
          turbulence: p.turbulence,
          cloudScale: p.cloudScale,
          brightness: p.brightness,
          contrast: p.contrast,
          saturation: p.saturation,
          hueShift: p.hueShift,
          glowIntensity: p.glowIntensity,
          octaves: p.octaves,
        },
        { cameraX, cameraY, zoom: v.zoom },
        timeRef.current,
        paletteRef.current
      );

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      nebula.dispose();
      nebulaRendererRef.current = null;
      starRendererRef.current = null;
      lastTickRef.current = 0;
    };
  }, [nebulaCanvasRef, starCanvasRef, containerRef]);

  useEffect(() => {
    const stars = starRendererRef.current;
    if (!stars) return;
    stars.generate(seed, params.starDensity);
    stars.draw();
  }, [seed, params.starDensity]);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const setParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const newSeed = useCallback(() => {
    setSeed(randomSeed());
  }, []);

  const setView = useCallback((updater) => {
    const v = viewRef.current;
    const next = typeof updater === "function" ? updater(v) : updater;
    Object.assign(viewRef.current, next);
  }, []);

  const resetView = useCallback(() => {
    Object.assign(viewRef.current, makeView());
  }, []);

  const exportPNG = useCallback(async () => {
    const nebula = nebulaRendererRef.current;
    const stars = starRendererRef.current;
    if (!nebula || !stars) return;
    const w = nebula.canvas.width;
    const h = nebula.canvas.height;

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(nebula.canvas, 0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(stars.canvas, 0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    const blob = await new Promise((resolve) =>
      out.toBlob(resolve, "image/png", 1)
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nebulaforge-${formatSeed(seedRef.current)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, [containerRef]);

  return {
    params,
    paramRanges: PARAM_RANGES,
    setParam,
    seed,
    setSeed,
    newSeed,
    viewRef,
    setView,
    resetView,
    exportPNG,
    toggleFullscreen,
    isFullscreen,
  };
}
