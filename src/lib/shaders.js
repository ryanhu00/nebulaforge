// GLSL ES 1.0 shaders for the nebula renderer.
// - Vertex: full-screen quad, passes UV.
// - Fragment: Ashima 3D simplex noise + FBM, threshold density, 4-stop palette,
//   radial falloff, low-frequency glow halo, HSV color trim.

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUV;
void main() {
  vUV = (aPos + 1.0) * 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Ashima Arts simplex noise (3D) — public domain reference implementation.
const ASHIMA_SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const COLOR_HELPERS = /* glsl */ `
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y)/(6.0*d + e)), d/(q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 palette4(float t, vec3 c0, vec3 c1, vec3 c2, vec3 c3){
  t = clamp(t, 0.0, 1.0);
  if (t < 0.3333) return mix(c0, c1, t / 0.3333);
  if (t < 0.6666) return mix(c1, c2, (t - 0.3333) / 0.3333);
  return mix(c2, c3, (t - 0.6666) / 0.3334);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUV;

uniform float uTime;
uniform vec2  uSeed;
uniform float uDensity;
uniform float uTurbulence;
uniform float uCloudScale;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uHueShift;
uniform float uGlowIntensity;
uniform int   uOctaves;
uniform vec3  uPalette0;
uniform vec3  uPalette1;
uniform vec3  uPalette2;
uniform vec3  uPalette3;
uniform vec2  uCamera;
uniform float uZoom;
uniform float uAspect;

${ASHIMA_SNOISE}
${COLOR_HELPERS}

const int MAX_OCTAVES = 8;

float fbm(vec3 p, float lacunarity, int octaves){
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    sum  += amp * snoise(p * freq);
    norm += amp;
    freq *= lacunarity;
    amp  *= 0.5;
  }
  return sum / max(norm, 0.0001);
}

// Ridged FBM amplifies wispy filament structure for that turbulent gas look.
float ridgedFbm(vec3 p, float lacunarity, int octaves){
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    float n = 1.0 - abs(snoise(p * freq));
    n *= n;
    sum  += amp * n;
    norm += amp;
    freq *= lacunarity;
    amp  *= 0.5;
  }
  return sum / max(norm, 0.0001);
}

void main() {
  vec2 uv = vUV - 0.5;
  uv.x *= uAspect;
  vec2 p = uv / uZoom + uCamera;

  float t = uTime * 0.05;
  vec3 samplePos = vec3(p * uCloudScale, t) + vec3(uSeed, uSeed.x * 0.37);

  float base = fbm(samplePos, uTurbulence, uOctaves);
  base = base * 0.5 + 0.5;

  float ridged = ridgedFbm(samplePos * 1.3 + vec3(11.0, 7.0, -3.0), uTurbulence, uOctaves);

  float density = mix(base, ridged, 0.55);
  density = smoothstep(0.42, 0.92, density * uDensity);

  float radial = smoothstep(1.25, 0.15, length(p));
  density *= radial;

  vec3 col = palette4(density, uPalette0, uPalette1, uPalette2, uPalette3);

  float glowField = fbm(samplePos * 0.35 + vec3(-4.2, 3.1, t * 0.6), 2.0, 4);
  glowField = glowField * 0.5 + 0.5;
  glowField = pow(glowField, 1.8) * radial;
  vec3 glowCol = mix(uPalette1, uPalette2, 0.6);
  col += glowCol * glowField * uGlowIntensity * 0.55;

  vec3 hsv = rgb2hsv(col);
  hsv.x = fract(hsv.x + uHueShift);
  hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.0);
  col = hsv2rgb(hsv);

  col = (col - 0.5) * uContrast + 0.5;
  col *= uBrightness;
  col = max(col, 0.0);

  float alpha = clamp(density + glowField * uGlowIntensity * 0.25 * radial, 0.0, 1.0);
  alpha = pow(alpha, 0.85);

  gl_FragColor = vec4(col * alpha, alpha);
}
`;
