// mulberry32 PRNG — small, fast, decent quality, fully deterministic per seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

// Format a numeric seed as a short uppercase hex string for display.
export function formatSeed(seed) {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

// Parse a user-typed seed (decimal or hex) back to a number; returns null on failure.
export function parseSeed(text) {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const asHex = parseInt(trimmed, 16);
  if (Number.isFinite(asHex)) return asHex >>> 0;
  const asDec = parseInt(trimmed, 10);
  return Number.isFinite(asDec) ? asDec >>> 0 : null;
}
