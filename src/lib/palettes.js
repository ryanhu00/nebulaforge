import { mulberry32 } from "./seed.js";

// HSL -> RGB conversion (all components in [0,1]).
function hslToRgb(h, s, l) {
  const k = (n) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

// Build a 4-color random palette from a seed. The shader blends these
// across the canvas via a low-frequency color-selection noise field, so
// different regions of the nebula take on different (but compatible) hues.
//
// A small set of harmony strategies keeps the colors visually cohesive
// without ever feeling repetitive across seeds.
export function generatePalette(seed) {
  const rng = mulberry32((seed >>> 0) ^ 0xc0ffee_19);

  // Pick a harmony strategy.
  const strategy = Math.floor(rng() * 5);
  const baseHue = rng();

  let hues;
  if (strategy === 0) {
    // Analogous — neighbouring hues, very cohesive (Hubble-like).
    const spread = 0.05 + rng() * 0.12;
    hues = [baseHue, baseHue + spread, baseHue + spread * 2, baseHue + spread * 3];
  } else if (strategy === 1) {
    // Complementary pair — two opposing hues, two near-neighbors of each.
    hues = [
      baseHue,
      baseHue + 0.5,
      baseHue + 0.04 + rng() * 0.06,
      baseHue + 0.5 - (0.04 + rng() * 0.06),
    ];
  } else if (strategy === 2) {
    // Split-complementary — base + two neighbours of its opposite.
    const split = 0.07 + rng() * 0.06;
    hues = [
      baseHue,
      baseHue + 0.5 - split,
      baseHue + 0.5 + split,
      baseHue + 0.02 + rng() * 0.05,
    ];
  } else if (strategy === 3) {
    // Triadic — three evenly spaced hues plus a near-base accent.
    hues = [baseHue, baseHue + 1 / 3, baseHue + 2 / 3, baseHue + 0.05 + rng() * 0.06];
  } else {
    // Free — fully random, occasionally chaotic and striking.
    hues = [rng(), rng(), rng(), rng()];
  }

  const stops = hues.map((h, i) => {
    const sat = 0.7 + rng() * 0.28;
    // Lightness varies a bit per stop so the four colors aren't identical
    // in luminance — gives subtle tonal depth when they blend.
    const lit = 0.42 + rng() * 0.18 + (i % 2 === 0 ? 0.0 : 0.05);
    const hue = ((h % 1) + 1) % 1;
    return hslToRgb(hue, sat, Math.min(0.72, lit));
  });

  // Light shuffle so the stop order isn't always hue-monotonic, which
  // lets the color-selection noise field create unexpected adjacencies.
  for (let i = stops.length - 1; i > 0; i--) {
    if (rng() < 0.35) {
      const j = Math.floor(rng() * (i + 1));
      [stops[i], stops[j]] = [stops[j], stops[i]];
    }
  }

  return stops;
}
