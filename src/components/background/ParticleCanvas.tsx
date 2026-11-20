import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';
import DarkFigureCloud from './DarkFigureCloud';
import { createLaptopSignature, createLetteringDetails, createLayoutTexture, createParticleLayouts, createSeedAttributes, FAN_PITCH, FAN_ROTOR_END, FAN_ROTOR_START, FAN_YAW, LAPTOP_BEZEL_END, LAPTOP_SIGNATURE_END, LETTER_DETAIL_START, laptopDisplayPoint } from './particleLayouts';
import { particleMotion } from './particleMotion';
import { useParticlePointer } from './useParticlePointer';
import { useParticleStages, type ParticleStages } from './useParticleStages';
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
uniform float uCompact;
uniform float uStageVisible;
uniform vec2 uCanvasSize;
uniform vec2 uPointer;
uniform vec2 uPointerVelocity;
uniform float uRepel;
uniform float uLaptopName;
uniform float uFormationHover;
attribute float aIndex;
attribute vec3 aLaptopSignature;
attribute vec3 aJavaDetail;
attribute vec3 aDsaDetail;
attribute float aSeed;
attribute float aTone;
varying float vTone;
varying float vAlpha;
varying float vDepth;
varying float vSignature;

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
  float band = aIndex / uCount;
  float pane = step(${LAPTOP_BEZEL_END}, band) * (1.0 - step(0.3, band));
  float signature = pane * (1.0 - step(${LAPTOP_SIGNATURE_END}, band)) * uLaptopName;
  vec3 letteringPoint = rotateY(aLaptopSignature, sin(uTime * .45) * .25 * uMotion);
  point = mix(point, letteringPoint, signature);
  // Reveal the annotation with some of the word's own points.
  float annotation = step(${LETTER_DETAIL_START}, band) * step(3.0, progress) * uFormationHover;
  point = mix(point, progress < 3.5 ? aJavaDetail : aDsaDetail, annotation);
  float detail = max(signature, annotation);
  float circuit = 0.0;
  if (progress == 1.0) {
    float distanceFromDie = max(abs(point.x), abs(point.y));
    // A wave runs across the die and through the contacts at the edges.
    circuit = uFormationHover * smoothstep(.22, .85, 1.0 - fract(distanceFromDie * .78 - uTime * 1.25));
  } else if (progress == 2.0 && band >= ${FAN_ROTOR_START} && band < ${FAN_ROTOR_END}) {
    circuit = uFormationHover * smoothstep(.41, 1.2, length(point.xy));
  }
  vec4 motion = particleMotion(point.xy, aSeed, uTime) * uMotion;
  // Keep the lettering's narrow strokes a little tighter than the hardware.
  float lettering = smoothstep(2.0, 3.0, progress);
  point += motion.xyz * vec3(.039, .036, .072) * mix(1.0, .72, lettering) * (1.0 - detail * .93);
  point = transformPoint(point, aSeed);

  vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
  vec4 clipPosition = projectionMatrix * viewPosition;
  float repelWeight = 1.0 - .65 * sin(fract(progress) * 3.14159265);
  if (repelWeight * uRepel > 0.001) {
    // Work in CSS pixels so the radius stays round at any viewport aspect ratio.
    vec2 canvasPixel = (clipPosition.xy / clipPosition.w + 1.0) * 0.5 * uCanvasSize;
    float speed = min(length(uPointerVelocity) / 1800.0, 1.0);
    vec2 trail = uPointerVelocity * .085;
    vec2 fromPointer = canvasPixel - uPointer;
    float alongTrail = clamp(-dot(fromPointer, trail) / max(dot(trail, trail), 1.0), 0.0, 1.0);
    vec2 away = fromPointer + trail * alongTrail;
    float radius = min(64.0 + 42.0 * speed, uCanvasSize.x * 0.18);
    float distance = length(away);
    float falloff = 1.0 - smoothstep(0.0, radius, distance);
    vec2 outward = away / max(distance, 0.1) * (radius * .42 + 28.0 * speed * aSeed);
    vec2 displacement = (outward + uPointerVelocity * (.018 + .038 * aSeed)) * falloff
      * repelWeight * uRepel * (1.0 - detail) * mix(1.0, .38 + .62 * speed, lettering);
    clipPosition.xy += 2.0 * displacement / uCanvasSize * clipPosition.w;
  }
  gl_Position = clipPosition;
  gl_PointSize = uPointSize * (0.72 + aSeed * 0.78) * (8.0 / max(4.0, -viewPosition.z)) * (1.0 + motion.w * .11);

  float screenX = clipPosition.x / clipPosition.w;
  float hero = 1.0 - smoothstep(0.08, 0.82, progress);
  float heroClearance = smoothstep(-0.16, 0.42, screenX);
  float mobileClearance = smoothstep(-0.44, 0.20, screenX);
  float clearance = mix(heroClearance, mobileClearance, step(uViewportWidth, 3.6));
  float transition = sin(fract(progress) * 3.14159265);
  vTone = aTone;
  vSignature = max(detail, circuit * .86);
  vDepth = clamp(1.15 - (-viewPosition.z / 22.0), 0.44, 1.0);
  vAlpha = mix(0.88, mix(0.12, 0.9, clearance), hero) * (1.0 - transition * 0.18) * (1.0 + motion.w * .19);
  vAlpha = mix(vAlpha, .95, uCompact);
  vAlpha = mix(vAlpha * (1.0 - pane * uLaptopName * .65), 1.0, max(detail, circuit * .54)) * uStageVisible;
}
`;

const POINT_FRAGMENT = /* glsl */ `
precision highp float;
varying float vTone;
varying float vAlpha;
varying float vDepth;
varying float vSignature;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float radius = length(centered) * 2.0;
  float core = 1.0 - smoothstep(0.5, 1.0, radius);
  float accent = smoothstep(0.94, 0.995, vTone);
  vec3 lightInk = mix(vec3(0.075, 0.105, 0.13), vec3(0.12, 0.28, 0.62), accent);
  lightInk = mix(lightInk, vec3(.035, .102, .28), vSignature);
  float alpha = core * mix(.52, .92, vSignature) * vDepth * vAlpha;
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
  const { java, dsa } = createLetteringDetails(count);
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(attributes.index, 1));
  geometry.setAttribute('aLaptopSignature', new THREE.BufferAttribute(createLaptopSignature(count), 3));
  geometry.setAttribute('aJavaDetail', new THREE.BufferAttribute(java, 3));
  geometry.setAttribute('aDsaDetail', new THREE.BufferAttribute(dsa, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(attributes.seed, 1));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(attributes.tone, 1));
  geometry.setDrawRange(0, count);
  return geometry;
}

const screenCorners = [[-1.44, -.83], [1.44, -.83], [1.44, .83], [-1.44, .83]]
  .map(([x, y]) => laptopDisplayPoint(x, y));
const verticalAxis = new THREE.Vector3(0, 1, 0);
const formationScales = [0.76, 0.64, 0.74, 0.9, 0.9];

function ParticleField({ count, reducedMotion, morph, fanAngle, stages }: { count: number; reducedMotion: boolean; morph: MutableRefObject<number>; fanAngle: MutableRefObject<number>; stages: MutableRefObject<ParticleStages> }) {
  const { theme } = useTheme();
  const uniformsRef = useRef<THREE.ShaderMaterial['uniforms'] | null>(null);
  const { gl, size, viewport } = useThree();
  const pointer = useParticlePointer(gl.domElement, theme === 'light' && !reducedMotion);
  const projectedScreen = useMemo(() => screenCorners.map(() => new THREE.Vector3()), []);
  const formationCenter = useMemo(() => new THREE.Vector3(), []);
  const fanHoverAngle = useRef(0);
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
    uCompact: { value: 0 },
    uStageVisible: { value: 1 },
    uCanvasSize: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2() },
    uPointerVelocity: { value: new THREE.Vector2() },
    uRepel: { value: 0 },
    uLaptopName: { value: 0 },
    uFormationHover: { value: 0 },
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
    const { compact, bounds, light } = stages.current;
    const display = !compact || bounds !== null;
    const { x, y, active: pointing, velocity } = pointer.current;
    const active = pointing && display;
    const repel = values.uRepel.value;
    const blend = 1 - Math.exp(-delta * 18);
    const cursor = values.uPointer.value;
    if (active) {
      if (repel < .001) cursor.set(x, y);
      else cursor.set(THREE.MathUtils.lerp(cursor.x, x, blend), THREE.MathUtils.lerp(cursor.y, y, blend));
    }
    values.uRepel.value = THREE.MathUtils.lerp(repel, Number(active), blend);
    values.uPointerVelocity.value.lerp(velocity, blend);
    velocity.multiplyScalar(Math.exp(-delta * 5));
    values.uCanvasSize.value.set(Math.max(1, size.width), Math.max(1, size.height));
    const stage = compact ? light : morph.current;
    values.uMorph.value = stage;
    values.uStageVisible.value = Number(display);
    values.uCompact.value = Number(compact);
    const unitsPerPixel = viewport.height / Math.max(1, size.height);
    const baseScale = bounds && compact
      ? Math.min(bounds.width / 3.65, bounds.height / (stage < 1 ? 2.9 : 2.7)) * unitsPerPixel
      : size.width < 900 ? 0.76 : Math.min(1.3, viewport.height / 4.45);
    values.uScale.value = baseScale;
    const horizontalOffset = size.width < 900 ? 0.28 : 0.29;
    values.uOffsetX.value = compact ? 0 : viewport.width * horizontalOffset;
    values.uOffsetY.value = compact && bounds
      ? (gl.domElement.getBoundingClientRect().bottom - (bounds.top + bounds.bottom) / 2 - size.height / 2 - (stage === 0 ? bounds.height * .07 : 0)) * unitsPerPixel
      : viewport.height * 0.025;
    values.uPointSize.value = (compact ? 2.22 : 2.5) * state.gl.getPixelRatio();
    values.uViewportWidth.value = viewport.width;

    let overScreen = active && stage === 0;
    if (overScreen) {
      const tilt = Math.sin(values.uTime.value * .45) * .25;
      screenCorners.forEach((corner, index) => {
        const point = projectedScreen[index];
        point.set(...corner).applyAxisAngle(verticalAxis, tilt).multiplyScalar(baseScale * .76);
        point.x += values.uOffsetX.value;
        point.y += values.uOffsetY.value;
        point.project(state.camera);
        point.x = (point.x + 1) * size.width / 2;
        point.y = (point.y + 1) * size.height / 2;
      });
      const sides = projectedScreen.map((point, index) => {
        const next = projectedScreen[(index + 1) % projectedScreen.length];
        return (next.x - point.x) * (y - point.y) - (next.y - point.y) * (x - point.x);
      });
      overScreen = sides.every(side => side >= 0) || sides.every(side => side <= 0);
    }
    values.uLaptopName.value = overScreen ? THREE.MathUtils.lerp(values.uLaptopName.value, 1, blend) : 0;

    let overFormation = false;
    if (active && Number.isInteger(stage) && stage > 0) {
      const side = stage % 2 === 0 ? 1 : -1;
      formationCenter.set(values.uOffsetX.value * side, values.uOffsetY.value, 0).project(state.camera);
      const pixelsPerUnit = size.height / viewport.height * baseScale * formationScales[stage];
      const localX = Math.abs(x - (formationCenter.x + 1) * size.width / 2) / pixelsPerUnit;
      const localY = Math.abs(y - (formationCenter.y + 1) * size.height / 2) / pixelsPerUnit;
      // Hardware reacts over the package/housing, and the words over their main line.
      overFormation = stage === 2 ? Math.hypot(localX, localY) < 1.52
        : stage === 1 ? localX < 1.22 && localY < 1.22
          : localX < (stage === 3 ? 1.68 : 1.36) && localY < .4;
    }
    const hover = Number.isInteger(stage) ? THREE.MathUtils.lerp(values.uFormationHover.value, Number(overFormation), 1 - Math.exp(-delta * 10)) : 0;
    values.uFormationHover.value = hover;
    if (stage === 2) fanHoverAngle.current = (fanHoverAngle.current + Math.min(delta, .05) * hover * 3.1) % (Math.PI * 2);
    values.uFanAngle.value = (compact ? values.uTime.value * .64 : fanAngle.current) + fanHoverAngle.current;
  });

  return <points geometry={points} material={pointMaterial} frustumCulled={false} />;
}

function ParticleScene({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const { theme } = useTheme();
  const lightProgress = useRef(0);
  const fanAngle = useRef(0);
  useScrollMorph(lightProgress, fanAngle);
  const stages = useParticleStages();
  return <>
    <group visible={theme === 'light'}><ParticleField count={count} reducedMotion={reducedMotion} morph={lightProgress} fanAngle={fanAngle} stages={stages} /></group>
    {theme === 'dark' && <DarkFigureCloud count={count} stages={stages} />}
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
