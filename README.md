# NebulaForge

An interactive procedural observatory for generating cinematic nebulae. Every
nebula you see is built live from layered noise on the GPU — there are no
pre-rendered images, no textures, and no two seeds produce the same view.

## What you see on screen

Two stacked canvases fill the viewport behind a glassy control panel.

1. **Nebula layer (WebGL)** — a single full-screen quad runs a fragment shader
   on every pixel, every frame. The shader builds the gas clouds from scratch
   using 3D simplex noise and the parameters from the panel.
2. **Star layer (Canvas 2D)** — a deterministic field of tiny stars sits in
   front of the nebula. Stars cluster toward bright nebula-shaped regions
   instead of being uniformly random, which gives the scene depth.
3. **Vignette and panel** — a soft radial darkening around the edges, plus the
   minimalist "Observatory" panel on the right.

The two layers are locked together when you pan, drift apart slightly when you
move the mouse (parallax depth), and scale together when you zoom.

## How a nebula is generated

Every frame, for every pixel, the GPU runs roughly this pipeline:

1. **Position the sample.** The pixel's screen UV is centered, aspect-corrected,
   then offset by the camera (pan, parallax, drift). Zoom divides this position
   so zooming in samples a smaller patch of noise space.
2. **Build density.** A fractal Brownian motion (FBM) of 3D simplex noise is
   blended with a *ridged* FBM that amplifies wispy filament structure. A
   smoothstep threshold turns the noise into cloud edges; a radial falloff
   keeps the brightest gas near the center.
3. **Pick the hue.** A *second*, slower, lower-frequency FBM — the
   color-selection field — gives a value in [0, 1] that's independent of
   density. This value indexes into the four-color random palette, so
   different regions of the canvas drift into different dominant hues that
   blend smoothly at their boundaries.
4. **Add glow.** A third, low-frequency FBM acts as a halo field. Its color is
   sampled at a hue offset of the main field, mimicking how surrounding gas
   often emits in a different spectral line than the dense core.
5. **Trim color.** HSV adjustments apply hue shift, saturation, brightness,
   and contrast.
6. **Composite.** The final pixel is output with premultiplied alpha, so deep
   space stays pure black where density is low.

The animation comes from feeding the current time into the noise as a third
spatial axis. The cloud isn't moving — you're slicing through an evolving
volumetric noise field, which is why the structures morph organically instead
of just scrolling.

## Generate

The **Generate** button at the top of the panel produces an entirely new
nebula. A new seed is drawn, and from that seed three things are derived
deterministically:

- A pair of large offsets into noise space, so the cloud shape is unrelated to
  the previous one.
- A fresh four-color random palette, chosen from one of five harmony
  strategies — analogous, complementary, split-complementary, triadic, or
  free — so colors stay visually cohesive without ever repeating.
- A new starfield, with star positions, sizes, brightnesses, and warm/cool
  tints all driven by the same seed.

The seed is shown in hex right below the button. The same seed always
reproduces the same nebula (given the same slider values).

## Controls

All sliders update in real time. The renderer reads them from a ref inside its
animation loop, so changes are reflected on the very next frame without a
React re-render.

| Control | What it does |
| --- | --- |
| Density | Where the smoothstep threshold cuts — higher fills more of the canvas with gas |
| Turbulence | The lacunarity (frequency multiplier) between FBM octaves — higher makes the structure more chaotic |
| Cloud Scale | Base frequency of the noise — higher zooms out and reveals smaller features |
| Brightness | Linear multiplier on the final RGB |
| Contrast | Stretches values away from mid-gray |
| Saturation | Multiplier on HSV saturation |
| Hue Shift | Rotates every color around the hue wheel |
| Glow Intensity | Strength of the halo field — adds bloom-like color around dense regions |
| Star Density | How many stars are generated, from a sparse field to a thick cluster |
| Noise Octaves | How many octaves of simplex noise are summed (2–8) — more octaves means finer filaments at the cost of GPU work |
| Animation Speed | Rate at which we move through the time axis of the 3D noise — 0 freezes the nebula |

## Navigating the view

- **Drag** anywhere on the canvas to pan. The nebula and the starfield move
  together pixel-for-pixel.
- **Scroll** to zoom (clamped between 0.3× and 4×). Both layers scale around
  the center.
- **Move the mouse** without dragging to apply mouse parallax — the nebula
  drifts slightly opposite the cursor, the stars drift less. The motion is
  smoothed so it feels like a gentle floating observatory rather than a
  twitchy follow.
- **Reset View** in the panel footer recenters and unzooms.
- **Fullscreen** in the panel footer takes over the screen for a true
  observatory feel.

## Export

The **Export PNG** button composites the WebGL nebula and the Canvas 2D star
layer onto a fresh offscreen canvas (using additive blending for the stars,
just like on screen) and downloads the result as
`nebulaforge-<seed>.png`. The exported image is at the canvas's full pixel
ratio, so it's print-quality.

## What's actually running

- **React 19 + Vite** for the app shell and HMR.
- **Tailwind v4** (CSS-first, via the `@tailwindcss/vite` plugin) for styling.
- **Framer Motion** for the panel slide-in and toggle animations.
- **simplex-noise** drives star clustering and lives in
  [`src/lib/starRenderer.js`](src/lib/starRenderer.js). The nebula's noise is a
  GLSL port of Ashima Arts' 3D simplex noise running on the GPU; see
  [`src/lib/shaders.js`](src/lib/shaders.js).
- A `mulberry32` PRNG in [`src/lib/seed.js`](src/lib/seed.js) makes everything
  seed-driven and reproducible.

## File layout

```
src/
  App.jsx                       Top-level layout
  components/
    NebulaCanvas.jsx            Both canvases + pointer-nav wiring
    ControlsPanel.jsx           Generate button, sliders, footer
    Slider.jsx                  Range input with value badge
    IconButton.jsx              Square icon button
  hooks/
    useNebulaController.js      RAF loop, params/seed/palette state, export, fullscreen
    usePointerNav.js            Drag pan, wheel zoom, mouse parallax
  lib/
    shaders.js                  Vertex + fragment GLSL (Ashima snoise, FBM, palette mix)
    nebulaRenderer.js           WebGL program, uniform setters, resize
    starRenderer.js             Seeded starfield drawn with additive blending
    palettes.js                 Seed -> 4-color random palette generator
    seed.js                     mulberry32 PRNG + seed formatting helpers
```
