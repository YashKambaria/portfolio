import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeProvider';
import ArmoredHero from './ArmoredHero';
import { createLayoutTexture, createParticleLayouts, createSeedAttributes } from './particleLayouts';
import styles from './ParticleBackground.module.css';

const POINT_VERTEX = /* glsl */ `
precision highp float;
uniform sampler2D uLayouts;
uniform float uRowsPerLayout;
uniform float uTileWidth;
uniform float uTextureHeight;
uniform float uMorph;
uniform float uTheme;
uniform float uTime;
uniform float uMotion;
uniform float uSpinAngle;
uniform float uPointSize;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uViewportWidth;
attribute float aIndex;
attribute float aSeed;
attribute float aTone;
varying float vTone;
varying float vSeed;
varying float vAlpha;
varying float vDepth;

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
  float hero = 1.0 - smoothstep(0.08, 0.82, uMorph);
  float fan = exp(-pow((uMorph - 2.0) / 0.34, 2.0));
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
  // The whole formation subtly turns with the reader's scroll momentum. The
  // fan uses the full signed angle, so down-scroll is clockwise on screen and
  // up-scroll reverses it rather than restarting a looping animation.
  point = rotateY(point, (uTime * 0.11 * hero + uSpinAngle * 0.12) * uMotion);
  point = rotateZ(point, uSpinAngle * fan * uMotion);

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
  point.x += wisp * (flowDirection * 0.56 * transition + wispWave * 0.10) * uMotion;
  point.y += wisp * cos(seed * 67.0 + uTime * 0.62) * (0.14 * transition + 0.035) * uMotion;
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
  vec3 point = mix(readLayout(fromLayout), readLayout(toLayout), morphAmount);
  point = transformPoint(point, aSeed);

  vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
  vec4 clipPosition = projectionMatrix * viewPosition;
  gl_Position = clipPosition;
  gl_PointSize = uPointSize * (0.72 + aSeed * 0.78) * (8.0 / max(4.0, -viewPosition.z));

  float screenX = clipPosition.x / clipPosition.w;
  float hero = 1.0 - smoothstep(0.08, 0.82, progress);
  float heroClearance = smoothstep(-0.16, 0.42, screenX);
  float mobileClearance = smoothstep(-0.44, 0.20, screenX);
  float clearance = mix(heroClearance, mobileClearance, step(uViewportWidth, 3.6));
  float transition = sin(fract(progress) * 3.14159265);
  vTone = aTone;
  vSeed = aSeed;
  vDepth = clamp(1.15 - (-viewPosition.z / 22.0), 0.44, 1.0);
  vAlpha = mix(0.88, mix(0.12, 0.9, clearance), hero) * (1.0 - transition * 0.18);
}
`;

const POINT_FRAGMENT = /* glsl */ `
precision highp float;
uniform float uTheme;
varying float vTone;
varying float vSeed;
varying float vAlpha;
varying float vDepth;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float radius = length(centered) * 2.0;
  float core = 1.0 - smoothstep(0.5, 1.0, radius);
  float accent = smoothstep(0.94, 0.995, vTone);
  vec3 lightInk = mix(vec3(0.075, 0.105, 0.13), vec3(0.12, 0.28, 0.62), accent);
  vec3 darkInk = mix(vec3(0.74, 0.78, 0.8), vec3(0.77, 0.52, 0.34), accent);
  vec3 color = mix(lightInk, darkInk, uTheme);
  float halo = exp(-radius * 4.6) * uTheme * (0.04 + accent * 0.08);
  color += vec3(0.38, 0.47, 0.52) * halo;
  float alpha = core * mix(0.52, 0.68, uTheme) * vDepth * vAlpha;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

function useScrollMorph(lightProgress: MutableRefObject<number>, darkProgress: MutableRefObject<number>, scrollVelocity: MutableRefObject<number>, reducedMotion: boolean) {
  useEffect(() => {
    let frame = 0;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    const update = () => {
      frame = 0;
      if (reducedMotion) return;
      const now = performance.now();
      const elapsed = Math.max(16, now - lastTime);
      scrollVelocity.current = THREE.MathUtils.clamp((window.scrollY - lastScrollY) / elapsed, -2.4, 2.4);
      lastScrollY = window.scrollY;
      lastTime = now;
      const scenes = Object.fromEntries(
        [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((element) => {
          const top = element.getBoundingClientRect().top + window.scrollY;
          return [element.dataset.scene ?? '', { top, bottom: top + element.offsetHeight }];
        }),
      );
      const transitions = Object.fromEntries(
        [...document.querySelectorAll<HTMLElement>('[data-particle-transition]')].map((element) => {
          const top = element.getBoundingClientRect().top + window.scrollY;
          return [element.dataset.particleTransition ?? '', { top, bottom: top + element.offsetHeight }];
        }),
      );
      const hero = scenes.hero;
      const atlas = scenes.atlas;
      const projects = scenes.projects;
      const capabilities = scenes.capabilities;
      const practice = scenes.practice;
      const about = scenes.about;
      const heroAtlas = transitions['hero-atlas'];
      const atlasProjects = transitions['atlas-projects'];
      const projectsCapabilities = transitions['projects-capabilities'];
      const capabilitiesPractice = transitions['capabilities-practice'];
      if (!hero || !atlas || !projects || !capabilities || !practice || !about || !heroAtlas || !atlasProjects || !projectsCapabilities || !capabilitiesPractice) return;
      const readingLine = window.scrollY + window.innerHeight * 0.46;
      const between = (start: number, end: number, from: number, to: number) =>
        THREE.MathUtils.lerp(from, to, THREE.MathUtils.smoothstep(readingLine, start, Math.max(start + 1, end)));

      // Forms hold for their owning section. Morphs happen only in the
      // deliberately empty transition gaps, so no incomplete object enters a
      // content section and reverse scrolling follows exactly the same path.
      if (readingLine < hero.bottom) lightProgress.current = 0;
      else if (readingLine < heroAtlas.bottom) lightProgress.current = between(heroAtlas.top, heroAtlas.bottom, 0, 1);
      else if (readingLine < atlas.bottom) lightProgress.current = 1;
      else if (readingLine < atlasProjects.bottom) lightProgress.current = between(atlasProjects.top, atlasProjects.bottom, 1, 2);
      else if (readingLine < projects.bottom) lightProgress.current = 2;
      else if (readingLine < projectsCapabilities.bottom) lightProgress.current = between(projectsCapabilities.top, projectsCapabilities.bottom, 2, 3);
      else if (readingLine < capabilities.bottom) lightProgress.current = 3;
      else if (readingLine < capabilitiesPractice.bottom) lightProgress.current = between(capabilitiesPractice.top, capabilitiesPractice.bottom, 3, 4);
      else lightProgress.current = 4;

      // The cinematic world shares scroll measurement with the engineering
      // world but maps it onto its own six-beat choreography.
      if (readingLine < hero.bottom) darkProgress.current = 0;
      else if (readingLine < heroAtlas.bottom) darkProgress.current = between(heroAtlas.top, heroAtlas.bottom, 0, 1);
      else if (readingLine < atlas.bottom) darkProgress.current = 1;
      else if (readingLine < atlasProjects.bottom) darkProgress.current = between(atlasProjects.top, atlasProjects.bottom, 1, 2);
      else if (readingLine < projects.bottom) darkProgress.current = 2;
      else if (readingLine < projectsCapabilities.bottom) darkProgress.current = between(projectsCapabilities.top, projectsCapabilities.bottom, 2, 3);
      else if (readingLine < capabilities.bottom) darkProgress.current = 3;
      else if (readingLine < capabilitiesPractice.bottom) darkProgress.current = between(capabilitiesPractice.top, capabilitiesPractice.bottom, 3, 4);
      else if (readingLine < practice.bottom) darkProgress.current = 4;
      else if (readingLine < about.bottom) darkProgress.current = between(practice.bottom, about.bottom, 4, 5);
      else darkProgress.current = 5;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [darkProgress, lightProgress, reducedMotion, scrollVelocity]);
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

function ParticleField({ count, reducedMotion, morph, scrollVelocity }: { count: number; reducedMotion: boolean; morph: MutableRefObject<number>; scrollVelocity: MutableRefObject<number> }) {
  const { theme } = useTheme();
  const uniformsRef = useRef<THREE.ShaderMaterial['uniforms'] | null>(null);
  const themeTarget = theme === 'dark' ? 1 : 0;
  const { size, viewport, invalidate } = useThree();
  const textureLeases = useRef(new WeakMap<THREE.Texture, number>());

  const layouts = useMemo(() => createParticleLayouts(count), [count]);
  const textureData = useMemo(() => createLayoutTexture(layouts, count), [layouts, count]);
  const points = useMemo(() => makePointGeometry(count), [count]);
  const uniforms = useMemo(() => ({
    uLayouts: { value: textureData.texture },
    uRowsPerLayout: { value: textureData.rowsPerLayout },
    uTileWidth: { value: 512 },
    uTextureHeight: { value: textureData.height },
    uMorph: { value: 0 },
    // Keep this uniforms object stable across theme changes. Recreating it
    // resets the shader material and briefly sends the formation back to its
    // initial state before the next animation frame catches up.
    uTheme: { value: themeTarget },
    uTime: { value: 0 },
    uMotion: { value: reducedMotion ? 0 : 1 },
    uSpinAngle: { value: 0 },
    uPointSize: { value: 2.4 },
    uScale: { value: 1 },
    uOffsetX: { value: 0 },
    uOffsetY: { value: 0 },
    uViewportWidth: { value: viewport.width },
  }), [reducedMotion, textureData, viewport.width]);

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

  useEffect(() => {
    if (reducedMotion && uniformsRef.current) {
      uniformsRef.current.uTheme.value = themeTarget;
      uniformsRef.current.uMorph.value = 0;
      invalidate();
    }
  }, [invalidate, reducedMotion, themeTarget]);

  useFrame((state, delta) => {
    if (!uniformsRef.current) return;
    const values = uniformsRef.current;
    values.uTheme.value = THREE.MathUtils.lerp(values.uTheme.value, themeTarget, 1 - Math.exp(-delta * 4.2));
    values.uMotion.value = reducedMotion ? 0 : 1;
    if (reducedMotion) return;

    values.uTime.value += Math.min(delta, 0.05);
    const signedVelocity = scrollVelocity.current;
    const speed = Math.min(Math.abs(signedVelocity) / 1.2, 1);
    values.uSpinAngle.value += Math.sign(signedVelocity) * (0.75 + speed * 7.25) * delta;
    // Carry a little momentum between wheel events, then let the formation
    // settle naturally when the reader stops.
    scrollVelocity.current *= Math.exp(-delta * 7);
    // Scroll is the timeline for the formations. Damping this value caused a
    // fast wheel/trackpad scroll to leave a half-morphed field visible after
    // the reader had already entered the next section. Keeping it in lockstep
    // with the measured scroll progress confines every morph to its spacer and
    // makes upward scrolling retrace the same transition without a lag.
    values.uMorph.value = morph.current;
    const compact = size.width < 720;
    const baseScale = compact ? 0.45 : size.width < 900 ? 0.76 : Math.min(1.3, viewport.height / 4.45);
    values.uScale.value = baseScale * (1 - values.uTheme.value * 0.08);
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
  const darkProgress = useRef(0);
  const scrollVelocity = useRef(0);
  useScrollMorph(lightProgress, darkProgress, scrollVelocity, reducedMotion);
  // Both timelines remain allocated in the one WebGL canvas. Switching theme
  // therefore changes visibility rather than loading/recreating a scene.
  return <>
    <group visible={theme === 'light'}><ParticleField count={count} reducedMotion={reducedMotion} morph={lightProgress} scrollVelocity={scrollVelocity} /></group>
    <group visible={theme === 'dark'}><ArmoredHero progress={darkProgress} reducedMotion={reducedMotion} active={theme === 'dark'} /></group>
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
