import { createNoise2D } from "simplex-noise";
import { mulberry32 } from "./seed.js";

// Builds and draws a starfield onto a 2D canvas with additive blending.
// Stars are biased toward bright nebula-like regions using a low-frequency
// simplex-noise field, so dense clusters appear where the nebula glows.

export function createStarRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let cssWidth = 0;
  let cssHeight = 0;
  let stars = [];

  function resize(w, h) {
    cssWidth = Math.max(1, Math.floor(w));
    cssHeight = Math.max(1, Math.floor(h));
    const dw = Math.floor(cssWidth * pixelRatio);
    const dh = Math.floor(cssHeight * pixelRatio);
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }

  function setPixelRatio(r) {
    pixelRatio = Math.max(0.5, Math.min(r, 2));
    if (cssWidth && cssHeight) resize(cssWidth, cssHeight);
  }

  // Generate a deterministic starfield. starDensity is a slider in [300, 4000].
  function generate(seed, starDensity) {
    const rng = mulberry32(seed ^ 0x9e3779b9);
    const noise = createNoise2D(mulberry32(seed ^ 0xa1c2e4d6));
    const count = Math.floor(starDensity);
    const out = new Array(count);

    let i = 0;
    let attempts = 0;
    const maxAttempts = count * 8;

    while (i < count && attempts < maxAttempts) {
      attempts++;
      const x = rng();
      const y = rng();

      // Sample noise at low frequency to weight star placement toward
      // bright nebula-shaped regions (and away from empty space).
      const n = noise(x * 2.4 - 1.2, y * 2.4 - 1.2);
      const bias = (n + 1) * 0.5;
      const accept = 0.18 + bias * 0.82;
      if (rng() > accept) continue;

      // Size distribution heavily weighted toward small stars.
      const r = rng();
      const size = 0.35 + Math.pow(r, 4) * 2.6;
      const brightness = 0.35 + Math.pow(rng(), 1.4) * 0.65;

      // Slight warm/cool tint per star.
      const tint = rng();
      let tintR, tintG, tintB;
      if (tint < 0.55) {
        tintR = 1.0;
        tintG = 0.97;
        tintB = 0.92;
      } else if (tint < 0.8) {
        tintR = 0.85;
        tintG = 0.92;
        tintB = 1.0;
      } else if (tint < 0.93) {
        tintR = 1.0;
        tintG = 0.85;
        tintB = 0.72;
      } else {
        tintR = 0.95;
        tintG = 0.78;
        tintB = 1.0;
      }

      out[i++] = { x, y, size, brightness, tintR, tintG, tintB };
    }

    stars = out.slice(0, i);
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    const dpr = pixelRatio;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = s.x * w;
      const sy = s.y * h;
      const radius = s.size * dpr;
      const b = s.brightness;

      // Core dot.
      ctx.fillStyle = `rgba(${(s.tintR * 255) | 0}, ${(s.tintG * 255) | 0}, ${
        (s.tintB * 255) | 0
      }, ${b})`;
      ctx.beginPath();
      ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Soft halo for larger stars.
      if (radius > 1.0) {
        const haloR = radius * 4.0;
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
        grd.addColorStop(
          0,
          `rgba(${(s.tintR * 255) | 0}, ${(s.tintG * 255) | 0}, ${
            (s.tintB * 255) | 0
          }, ${b * 0.55})`
        );
        grd.addColorStop(
          0.45,
          `rgba(${(s.tintR * 255) | 0}, ${(s.tintG * 255) | 0}, ${
            (s.tintB * 255) | 0
          }, ${b * 0.12})`
        );
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = "source-over";
  }

  return {
    canvas,
    resize,
    setPixelRatio,
    generate,
    draw,
    getStars: () => stars,
  };
}
