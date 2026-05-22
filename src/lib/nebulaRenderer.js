import { VERTEX_SHADER, FRAGMENT_SHADER } from "./shaders.js";

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return sh;
}

function link(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link failed: ${log}`);
  }
  return prog;
}

const UNIFORM_NAMES = [
  "uTime",
  "uSeed",
  "uDensity",
  "uTurbulence",
  "uCloudScale",
  "uBrightness",
  "uContrast",
  "uSaturation",
  "uHueShift",
  "uGlowIntensity",
  "uOctaves",
  "uPalette0",
  "uPalette1",
  "uPalette2",
  "uPalette3",
  "uCamera",
  "uZoom",
  "uAspect",
];

export function createNebulaRenderer(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  if (!gl) throw new Error("WebGL is not available in this browser");

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const prog = link(gl, vs, fs);
  gl.useProgram(prog);

  const uniforms = {};
  for (const name of UNIFORM_NAMES) {
    uniforms[name] = gl.getUniformLocation(prog, name);
  }

  // Full-screen quad (two triangles).
  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  let cssWidth = 0;
  let cssHeight = 0;

  function resize(w, h) {
    cssWidth = Math.max(1, Math.floor(w));
    cssHeight = Math.max(1, Math.floor(h));
    const dw = Math.floor(cssWidth * pixelRatio);
    const dh = Math.floor(cssHeight * pixelRatio);
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    gl.viewport(0, 0, dw, dh);
  }

  function setPixelRatio(r) {
    pixelRatio = Math.max(0.5, Math.min(r, 2));
    if (cssWidth && cssHeight) resize(cssWidth, cssHeight);
  }

  function render(params, view, time, palette) {
    gl.useProgram(prog);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(uniforms.uTime, time);
    gl.uniform2f(uniforms.uSeed, params.seedX, params.seedY);
    gl.uniform1f(uniforms.uDensity, params.density);
    gl.uniform1f(uniforms.uTurbulence, params.turbulence);
    gl.uniform1f(uniforms.uCloudScale, params.cloudScale);
    gl.uniform1f(uniforms.uBrightness, params.brightness);
    gl.uniform1f(uniforms.uContrast, params.contrast);
    gl.uniform1f(uniforms.uSaturation, params.saturation);
    gl.uniform1f(uniforms.uHueShift, params.hueShift);
    gl.uniform1f(uniforms.uGlowIntensity, params.glowIntensity);
    gl.uniform1i(uniforms.uOctaves, params.octaves | 0);
    gl.uniform3fv(uniforms.uPalette0, palette[0]);
    gl.uniform3fv(uniforms.uPalette1, palette[1]);
    gl.uniform3fv(uniforms.uPalette2, palette[2]);
    gl.uniform3fv(uniforms.uPalette3, palette[3]);
    gl.uniform2f(uniforms.uCamera, view.cameraX, view.cameraY);
    gl.uniform1f(uniforms.uZoom, view.zoom);
    const aspect = canvas.width / Math.max(canvas.height, 1);
    gl.uniform1f(uniforms.uAspect, aspect);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function dispose() {
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  }

  return {
    canvas,
    gl,
    render,
    resize,
    setPixelRatio,
    dispose,
    getPixelRatio: () => pixelRatio,
  };
}
