// Each palette is a 4-stop gradient sampled from dim background -> hot core.
// Stops are linear RGB triples in [0,1]; the shader mixes between them as density rises.
// previewCSS is for the UI swatch only.

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
};

const palette = (name, stops) => ({
  name,
  stops: stops.map(hex),
  previewCSS: `linear-gradient(135deg, ${stops.join(", ")})`,
});

export const PALETTES = [
  palette("Orion", ["#0a0420", "#3a1a6b", "#c4528e", "#ffd1a8"]),
  palette("Lagoon", ["#03101f", "#0e3a5e", "#6fb6e0", "#ffe8c4"]),
  palette("Eagle", ["#100804", "#5a2a14", "#d6883a", "#ffe5a8"]),
  palette("Pillars of Creation", ["#0a0a06", "#2a3a18", "#c97a3a", "#f8d680"]),
  palette("Hubble SHO", ["#04081c", "#0e7a8a", "#e0a830", "#ff6a4a"]),
  palette("Infrared", ["#1a0606", "#7a1818", "#ff9a5a", "#fff0d2"]),
  palette("Hydrogen Alpha", ["#160308", "#5a0a2a", "#d23a6c", "#ffd6e2"]),
  palette("Oxygen III", ["#020a14", "#0a3a5e", "#3ec2c8", "#d6f6ff"]),
  palette("Deep Space Violet", ["#06031a", "#3a1a7a", "#a05ad6", "#ffd1f0"]),
  palette("Cosmic Fire", ["#1a0500", "#8a1e08", "#ff7a1a", "#fff4c4"]),
];

export const DEFAULT_PALETTE_INDEX = 4; // Hubble SHO — cinematic default
