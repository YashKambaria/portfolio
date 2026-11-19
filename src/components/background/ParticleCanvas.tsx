import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';
import DarkFigureCloud from './DarkFigureCloud';
import { createLayoutTexture, createParticleLayouts, createSeedAttributes, FAN_PITCH, FAN_ROTOR_END, FAN_ROTOR_START, FAN_YAW } from './particleLayouts';
import { particleMotion } from './particleMotion';
import styles from './ParticleBackground.module.css';

const POINT_VERTEX = /* glsl */ `
precision highp float;
uniform sampler2D uLayouts;
uniform float uRowsPerLayout;
uniform float uTileWidth;
uniform float uTextureHeight;
uniform float uMorph;
uniform float uTime;
uniform float uMotion;
uniform float uFanAngle;
uniform float uCount;
uniform float uPointSize;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uViewportWidth;
attribute float aIndex;
attribute float aSeed;
attribute float aTone;
varying float vTone;
varying float vAlpha;
varying float vDepth;

${particleMotion}

vec3 readLayout(float layoutIndex) {
  float column = mod(aIndex, uTileWidth);
  float row = floor(aIndex / uTileWidth) + layoutIndex * uRowsPerLayout;
  vec2 uv = (vec2(column, row) + 0.5) / vec2(uTileWidth, uTextureHeight);
  return texture2D(uLayouts, uv).xyz;
}

vec3 rotateY(vec3 point, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  point.xz = mat2(cosine, -sine, sine, cosine) * point.xz;
  return point;
}

vec3 rotateZ(vec3 point, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  point.xy = mat2(cosine, -sine, sine, cosine) * point.xy;
  return point;
}

vec3 poseLayout(float layoutIndex) {
  vec3 point = readLayout(layoutIndex);
  if (layoutIndex == 0.0) {
    return rotateY(point, sin(uTime * .45) * .25 * uMotion);
  }
  if (layoutIndex == 2.0) {
    float band = aIndex / uCount;
    if (band >= ${FAN_ROTOR_START} && band < ${FAN_ROTOR_END}) point = rotateZ(point, uFanAngle * uMotion);
    point = rotateY(point, ${FAN_YAW});
    float pitch = ${FAN_PITCH};
    point.yz = mat2(cos(pitch), sin(pitch), -sin(pitch), cos(pitch)) * point.yz;
  }
  return point;
}

float formationScale(float formation) {
  if (formation < 0.5) return 0.76; // laptop
  if (formation < 1.5) return 0.64; // CPU has pins and needs extra breathing room
  if (formation < 2.5) return 0.74; // fan
  return 0.9; // compact text forms
}

// A quintic easing curve keeps the field calm as it enters and leaves each
// scroll gap. Unlike a delayed uniform, this remains perfectly scroll-bound.
float smootherstep(float value) {
  value = clamp(value, 0.0, 1.0);
  return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
}

vec3 transformPoint(vec3 point, float seed) {
  float stage = floor(clamp(uMorph, 0.0, 4.0));
  float phase = fract(uMorph);
  // The first part of a transition opens the object. Translation begins after
  // that brief release, so the motion reads as scatter → travel → resolve.
  float travel = smootherstep((phase - 0.12) / 0.82);
  // Hero starts on the right. Every successive stage occupies the opposite
  // reading lane, so motion travels through the reserved whitespace.
  float fromSide = mix(1.0, -1.0, mod(stage, 2.0));
  float side = mix(fromSide, -fromSide, travel);
  float nextStage = min(4.0, stage + 1.0);
  float formScale = mix(formationScale(stage), formationScale(nextStage), smootherstep(phase));

  float transition = sin(phase * 3.14159265);
  vec3 microMotion = vec3(
    sin(seed * 37.0 + uTime * 0.72),
    cos(seed * 53.0 + uTime * 0.64),
    sin(seed * 71.0 + uTime * 0.58)
  );
  // Most particles retain the form's silhouette, while a small seed-selected
  // group drifts sideways as it travels. The wisps make the field feel less
  // mechanically perfect without leaking out of the dedicated transition gap.
  float wisp = smootherstep((fract(seed * 13.7) - 0.78) / 0.22);
  float flowDirection = -fromSide;
  float wispWave = sin(seed * 91.0 + uTime * 0.8);
  point += microMotion * (0.24 * transition * uMotion);
  point.x += wisp * (flowDirection * 0.56 + wispWave * 0.10) * transition * uMotion;
  point.y += wisp * cos(seed * 67.0 + uTime * 0.62) * 0.175 * transition * uMotion;
  point *= uScale * formScale;
  point.x += uOffsetX * side;
  point.y += uOffsetY;
  return point;
}

void main() {
  float progress = clamp(uMorph, 0.0, 4.0);
  float fromLayout = floor(progress);
  float toLayout = min(4.0, fromLayout + 1.0);
  float morphAmount = smootherstep(fract(progress));
  vec3 point = mix(poseLayout(fromLayout), poseLayout(toLayout), morphAmount);
  vec4 motion = particleMotion(point.xy, aSeed, uTime) * uMotion;
  // Keep the lettering's narrow strokes a little tighter than the hardware.
  float lettering = smoothstep(2.0, 3.0, progress);
  point += motion.xyz * vec3(.039, .036, .072) * mix(1.0, .72, lettering);
  point = transformPoint(point, aSeed);

  vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
  vec4 clipPosition = projectionMatrix * viewPosition;
  gl_Position = clipPosition;
  gl_PointSize = uPointSize * (0.72 + aSeed * 0.78) * (8.0 / max(4.0, -viewPosition.z)) * (1.0 + motion.w * .11);

  float screenX = clipPosition.x / clipPosition.w;
  float hero = 1.0 - smoothstep(0.08, 0.82, progress);
  float heroClearance = smoothstep(-0.16, 0.42, screenX);
  float mobileClearance = smoothstep(-0.44, 0.20, screenX);
  float clearance = mix(heroClearance, mobileClearance, step(uViewportWidth, 3.6));
  float transition = sin(fract(progress) * 3.14159265);
  vTone = aTone;
  vDepth = clamp(1.15 - (-viewPosition.z / 22.0), 0.44, 1.0);
  vAlpha = mix(0.88, mix(0.12, 0.9, clearance), hero) * (1.0 - transition * 0.18) * (1.0 + motion.w * .19);
}
`;

const POINT_FRAGMENT = /* glsl */ `
precision highp float;
varying float vTone;
varying float vAlpha;
varying float vDepth;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float radius = length(centered) * 2.0;
  float core = 1.0 - smoothstep(0.5, 1.0, radius);
  float accent = smoothstep(0.94, 0.995, vTone);
  vec3 lightInk = mix(vec3(0.075, 0.105, 0.13), vec3(0.12, 0.28, 0.62), accent);
  float alpha = core * 0.52 * vDepth * vAlpha;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(lightInk, alpha);
}
`;

function useScrollMorph(morph: MutableRefObject<number>, fanAngle: MutableRefObject<number>) {
  useLayoutEffect(() => {
    const gaps = [...document.querySelectorAll<HTMLElement>('[data-particle-transition]')];
    const projects = document.getElementById('work');
    if (!projects || gaps.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const readingLine = window.innerHeight * 0.46;
      // Each gap contributes one completed morph, or part of one while the
      // reading line travels through it. This also handles restored scroll.
      morph.current = gaps.reduce((value, gap) => {
        const bounds = gap.getBoundingClientRect();
        return value + THREE.MathUtils.smoothstep(readingLine, bounds.top, bounds.bottom);
      }, 0);
      const bounds = projects.getBoundingClientRect();
      const progress = THREE.MathUtils.clamp((readingLine - bounds.top) / Math.max(1, bounds.height), 0, 1);
      fanAngle.current = progress * Math.PI * 3;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    if (projects.parentElement) observer.observe(projects.parentElement);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [fanAngle, morph]);
}

function makePointGeometry(count: number) {
  const geometry = new THREE.BufferGeometry();
  const attributes = createSeedAttributes(count);
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(attributes.index, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(attributes.seed, 1));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(attributes.tone, 1));
  geometry.setDrawRange(0, count);
  return geometry;
}

function ParticleField({ count, reducedMotion, morph, fanAngle }: { count: number; reducedMotion: boolean; morph: MutableRefObject<number>; fanAngle: MutableRefObject<number> }) {
  const { theme } = useTheme();
  const uniformsRef = useRef<THREE.ShaderMaterial['uniforms'] | null>(null);
  const { size, viewport } = useThree();
  const textureLeases = useRef(new WeakMap<THREE.Texture, number>());

  const layouts = useMemo(() => createParticleLayouts(count), [count]);
  const textureData = useMemo(() => createLayoutTexture(layouts, count), [layouts, count]);
  const points = useMemo(() => makePointGeometry(count), [count]);
  const uniforms = useMemo(() => ({
    uLayouts: { value: textureData.texture },
    uRowsPerLayout: { value: textureData.rowsPerLayout },
    uTileWidth: { value: 512 },
    uTextureHeight: { value: textureData.height },
    uMorph: { value: morph.current },
    uTime: { value: 0 },
    uMotion: { value: reducedMotion ? 0 : 1 },
    uFanAngle: { value: fanAngle.current },
    uCount: { value: count },
    uPointSize: { value: 2.4 },
    uScale: { value: 1 },
    uOffsetX: { value: 0 },
    uOffsetY: { value: 0 },
    uViewportWidth: { value: 0 },
  }), [count, fanAngle, morph, reducedMotion, textureData]);

  uniformsRef.current = uniforms;

  const pointMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  }), [uniforms]);

  useEffect(() => {
    const texture = textureData.texture;
    const lease = (textureLeases.current.get(texture) ?? 0) + 1;
    textureLeases.current.set(texture, lease);
    return () => {
      queueMicrotask(() => {
        if (textureLeases.current.get(texture) === lease) texture.dispose();
      });
    };
  }, [textureData]);

  useFrame((state, delta) => {
    if (!uniformsRef.current || reducedMotion || theme !== 'light') return;
    const values = uniformsRef.current;
    values.uTime.value += Math.min(delta, 0.05);
    values.uFanAngle.value = fanAngle.current;
    values.uMorph.value = morph.current;
    const compact = size.width < 720;
    const baseScale = compact ? 0.45 : size.width < 900 ? 0.76 : Math.min(1.3, viewport.height / 4.45);
    values.uScale.value = baseScale;
    const horizontalOffset = compact ? 0.26 : size.width < 900 ? 0.28 : 0.29;
    values.uOffsetX.value = viewport.width * horizontalOffset;
    values.uOffsetY.value = viewport.height * (compact ? 0.055 : 0.025);
    values.uPointSize.value = (compact ? 2.1 : 2.5) * state.gl.getPixelRatio();
    values.uViewportWidth.value = viewport.width;
  });

  return <points geometry={points} material={pointMaterial} frustumCulled={false} />;
}

function ParticleScene({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const { theme } = useTheme();
  const lightProgress = useRef(0);
  const fanAngle = useRef(0);
  useScrollMorph(lightProgress, fanAngle);
  return <>
    <group visible={theme === 'light'}><ParticleField count={count} reducedMotion={reducedMotion} morph={lightProgress} fanAngle={fanAngle} /></group>
    {theme === 'dark' && <DarkFigureCloud count={count} />}
  </>;
}

function particleBudget() {
  const width = window.innerWidth;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (width < 640) return 7000;
  if (memory <= 4 || cores <= 4) return 14000;
  if (width >= 1440 && memory >= 8 && cores >= 8) return 24000;
  return 20000;
}

export default function ParticleCanvas({ onReady, onContextLost }: { onReady: () => void; onContextLost: (lost: boolean) => void }) {
  const [count, setCount] = useState(particleBudget);
  const [active, setActive] = useState(() => !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const contextObserver = useRef<IntersectionObserver | null>(null);
  const currentCanvas = useRef<HTMLCanvasElement | null>(null);
  const lostHandler = useRef<((event: Event) => void) | null>(null);
  const restoredHandler = useRef<(() => void) | null>(null);

  useEffect(() => {
    const lowMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(lowMotion.matches);
    const updateVisibility = () => setActive(!document.hidden);
    const updateBudget = () => setCount(particleBudget());
    const narrow = window.matchMedia('(max-width: 639px)');
    lowMotion.addEventListener('change', updateMotion);
    narrow.addEventListener('change', updateBudget);
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('resize', updateBudget, { passive: true });
    return () => {
      lowMotion.removeEventListener('change', updateMotion);
      narrow.removeEventListener('change', updateBudget);
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('resize', updateBudget);
    };
  }, []);

  useEffect(() => () => {
    if (currentCanvas.current && lostHandler.current) currentCanvas.current.removeEventListener('webglcontextlost', lostHandler.current);
    if (currentCanvas.current && restoredHandler.current) currentCanvas.current.removeEventListener('webglcontextrestored', restoredHandler.current);
    contextObserver.current?.disconnect();
  }, []);

  const handleCreated = (state: RootState) => {
    const canvas = state.gl.domElement;
    currentCanvas.current = canvas;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost(true);
      setActive(false);
    };
    const restored = () => {
      onContextLost(false);
      setActive(!document.hidden);
      onReady();
    };
    lostHandler.current = lost;
    restoredHandler.current = restored;
    canvas.addEventListener('webglcontextlost', lost, false);
    canvas.addEventListener('webglcontextrestored', restored, false);
    contextObserver.current?.disconnect();
    contextObserver.current = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting) && !document.hidden));
    contextObserver.current.observe(canvas);
    onContextLost(false);
    onReady();
  };

  return <div className={styles.canvasHost}>
    <Canvas
      camera={{ position: [0, 0, 8], fov: 38, near: 0.1, far: 80 }}
      dpr={[1, 1.35]}
      frameloop={active && !reducedMotion ? 'always' : 'demand'}
      gl={{ alpha: true, antialias: false, depth: true, powerPreference: 'low-power', preserveDrawingBuffer: false, stencil: false }}
      onCreated={handleCreated}
      fallback={null}
    >
      <ParticleScene count={count} reducedMotion={reducedMotion} />
    </Canvas>
  </div>;
}
