import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Vector2, Vector4, type ShaderMaterial } from 'three';
import { createDarkFigureEffects, darkCueZones, darkEffectsFragment, darkEffectsVertex, findInfinityStone, insideCue, stoneDepth, stonePowers, throneBelt, throneCenter } from './darkFigureEffects';
import { createDoomDebris, debrisVertex } from './doomDebris';
import { createIronLaunchParticles, ironLaunchVertex, ironShots, ironImpactEvent, ironLaunchEvent, ironResetEvent, type IronImpact, type IronLaunch } from './ironLaunchParticles';
import { loadFigureReference, sampleDarkFigure, touchesSilhouette } from './darkFigurePoints';
import { useParticlePointer } from './useParticlePointer';
import { mobileParticleQuery, type ParticleStages } from './useParticleStages';
import { particleMotion } from './particleMotion';
import { createPowerBeam, powerBeamVertex } from './powerStone';

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uSit;
  uniform float uIronHeight;
  uniform float uDoomHeight;
  uniform float uSeatHeight;
  uniform float uLane;
  uniform float uStageY;
  uniform float uStageVisible;
  uniform float uPointSize;
  uniform float uReveal;
  uniform float uTime;
  uniform vec4 uBrush;
  uniform float uBrushPresence;
  uniform vec4 uProtected[4];
  uniform vec4 uBelt;
  uniform float uCues[6];
  uniform float uDebrisPower;
  uniform float uPowerAge;
  uniform float uPowerCharge;
  attribute vec3 aDoom;
  attribute vec3 aSeat;
  attribute vec3 aIronDetail;
  attribute vec3 aDoomDetail;
  attribute vec3 aSeatDetail;
  attribute vec4 aIronPaint;
  attribute vec4 aDoomPaint;
  attribute vec4 aSeatPaint;
  varying vec3 vColor;
  varying float vAlpha;

  ${particleMotion}

  float ease(float x) {
    x = clamp(x, 0.0, 1.0);
    return x * x * x * (x * (6.0 * x - 15.0) + 10.0);
  }

  vec3 doomColor(vec4 paint, vec3 detail) {
    float photo = step(.5, paint.a);
    vec3 base = mix(vec3(.23, .44, .33), vec3(.91, .96, .93), detail.x);
    // Keep the silver faceplate distinct from the green hood and throne.
    vec3 tint = mix(vec3(.82, 1.04, .92), vec3(1.13, 1.16, 1.16), detail.z);
    vec3 armor = min(vec3(1.0), pow(paint.rgb, vec3(.53)) * tint * (1.02 + detail.y * .12));
    return mix(base, armor, photo * .86);
  }

  float zoneDistance(vec2 point, vec4 zone) {
    return length((point - zone.xy) / max(zone.zw, vec2(.001)));
  }

  void main() {
    float phase = clamp(uProgress - 1.0, 0.0, 1.0);
    float morph = ease(phase);
    float travel = ease((phase - 0.10) / 0.82);
    float side = 1.0 - 2.0 * ease(uProgress) + 2.0 * travel;
    float burst = sin(phase * 3.14159265);
    float seed = fract(sin(dot(position.xy, vec2(127.1, 311.7))) * 43758.5453);

    vec3 standing = aDoom * uDoomHeight;
    vec3 seated = aSeat * uSeatHeight;
    seated.y += (uSeatHeight - uDoomHeight) * .5;

    // Disperse the whole silhouette into a stable cloud, then gather the same
    // points into the seated silhouette and throne as the reader scrolls.
    float lift = fract(sin(dot(aDoom.xy, vec2(69.7, 183.3))) * 31631.448);
    float depth = fract(sin(dot(aSeat.xy, vec2(215.9, 57.1))) * 11981.714);
    float spread = ease(uSit / .48);
    float gather = ease((uSit - .48) / .52);
    float vertical = lift * 2.0 - 1.0;
    float radial = sqrt(max(0.0, 1.0 - vertical * vertical));
    float angle = seed * 6.2831853;
    vec3 cloud = vec3(cos(angle) * radial * .28, vertical * .51, sin(angle) * radial * .20)
      * pow(depth, .3333) * uDoomHeight;
    vec3 settle = mix(mix(standing, cloud, spread), seated, gather);

    vec3 point = mix(position * uIronHeight, settle, morph);
    float height = mix(uIronHeight, mix(uDoomHeight, uSeatHeight, gather), morph);
    float pose = ease(uSit);
    float eye = step(1.5, aIronPaint.a) * (1.0 - morph);
    float anchor = max(eye, mix(aIronDetail.y, mix(aDoomDetail.y, aSeatDetail.y, pose), morph));
    vec4 motion = particleMotion(point.xy * (3.2 / max(height, .001)), seed, uTime * .64);
    point += motion.xyz * vec3(.0045, .004, .009) * height * mix(1.0, .12, anchor);
    point += vec3(cos(angle) * .15, sin(angle) * .10, sin(angle * 2.0) * .17)
      * burst * (.35 + seed) * mix(uIronHeight, uDoomHeight, morph);
    point.x += side * uLane;
    point.y += uStageY;

    // Repel the nearby surface points and pass momentum along the wake of a swipe.
    // Faces retain their sampled position while armor, cape and stone respond.
    float speed = length(uBrush.zw);
    vec2 trail = uBrush.zw * height * .17;
    vec2 away = point.xy - uBrush.xy;
    away += trail * clamp(-dot(away, trail) / max(.001, dot(trail, trail)), 0.0, 1.0);
    float reach = (.097 + .085 * speed) * height;
    float brushFalloff = 1.0 - smoothstep(0.0, reach, length(away));
    float face = mix(max(aIronDetail.z, smoothstep(.26, .36, position.y)),
      mix(max(aDoomDetail.z, smoothstep(.26, .35, aDoom.y)), aSeatDetail.z, pose), morph);
    float ironSafe = min(zoneDistance(position.xy, uProtected[0]), zoneDistance(position.xy, uProtected[1]));
    float handSafe = min(zoneDistance(aDoom.xy, uProtected[2]), zoneDistance(aDoom.xy, uProtected[3]));
    float unlocked = mix(smoothstep(.86, 1.19, mix(ironSafe, handSafe, morph)), 1.0, pose);
    float repel = brushFalloff * uBrushPresence * unlocked * (1.0 - max(face, eye)) * mix(1.0, .57, anchor);
    vec2 radialPush = away / max(length(away), .001) * (.055 + .095 * speed * seed);
    point.xy += (radialPush + uBrush.zw * (.045 + .095 * seed)) * height * repel;
    float swipe = repel * speed;

    vec4 view = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = uPointSize * (.72 + seed * .56 + eye * .12) * 8.0 / -view.z;

    vec3 iron = mix(vec3(.73, .19, .16), vec3(1.0, .86, .61), pow(aIronDetail.x, 1.4));
    vec3 armor = pow(aIronPaint.rgb, vec3(.61));
    float luminance = dot(armor, vec3(.2126, .7152, .0722));
    armor = clamp(mix(vec3(luminance), armor, 1.18), 0.0, 1.0);
    float painted = step(.5, aIronPaint.a);
    iron = mix(iron, armor, painted);
    iron = mix(iron, vec3(.78, .96, 1.0), eye * .18);
    float gauntlet = 1.0 - smoothstep(.54, 1.18, zoneDistance(position.xy, uProtected[1]));
    float charge = smoothstep(.06, .78, uPowerAge) * uPowerCharge * gauntlet;
    float pulse = .80 + .20 * sin(uPowerAge * 18.0 - position.y * 26.0);
    iron = mix(iron, mix(vec3(.43, .19, .70), vec3(.95, .71, 1.0), aIronDetail.x), charge * pulse * .89);
    vec3 doom = doomColor(aDoomPaint, aDoomDetail);
    vec3 throne = doomColor(aSeatPaint, aSeatDetail);
    vColor = mix(iron, mix(doom, throne, pose), morph);
    vColor = mix(vColor, mix(vec3(.77, .91, 1.0), vec3(.37, .84, .59), morph), swipe * .65);
    float standingMask = step(2.0, uProgress) * (1.0 - step(.001, uSit)) * uDebrisPower * aDoomDetail.z;
    vColor = mix(vColor, mix(vec3(.39, .58, .45), vec3(.89, 1.0, .92), aDoomDetail.x), standingMask * .63);
    float ironAlpha = mix(mix(.18, .93, aIronDetail.x), .86 + .13 * eye, painted);
    float standingAlpha = mix(.43, .97, aDoomDetail.x);
    float seatedAlpha = mix(.45, .98, aSeatDetail.x);
    float cloudOpacity = 1.0 - .26 * spread * (1.0 - gather);
    vAlpha = mix(ironAlpha, mix(standingAlpha, seatedAlpha, pose) * cloudOpacity, morph);
    // The seated painting already distinguishes the throne from the body.
    float seatPower = step(1.0, uSit) * step(2.0, uProgress) * max(uCues[4], uCues[5]);
    float furniture = step(1.5, aSeatPaint.a);
    float buckle = 1.0 - smoothstep(.38, 1.0, zoneDistance(aSeat.xy, uBelt));
    float glow = seatPower * max(furniture, buckle);
    float shimmer = .83 + .17 * sin(aSeat.y * 13.0 - uTime * 1.9);
    vec3 litThrone = mix(vec3(.14, .48, .28), vec3(.60, 1.0, .71), aSeatDetail.x * shimmer);
    vec3 litBelt = mix(vec3(.42, .54, .28), vec3(.90, 1.0, .68), aSeatDetail.x);
    vColor = mix(vColor, mix(litBelt, litThrone, furniture), glow * .88);
    vAlpha = mix(vAlpha, .91, glow * .78);
    vAlpha *= uStageVisible * (1.0 - burst * .32) * ease(uReveal) * (1.0 + motion.w * mix(.13, .025, anchor));
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float radius = length(gl_PointCoord - .5) * 2.0;
    float alpha = (1.0 - smoothstep(.48, 1.0, radius)) * vAlpha;
    if (alpha < .01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const progressAt = (element: Element | null, readingLine: number) => {
  const bounds = element?.getBoundingClientRect();
  return bounds ? Math.min(1, Math.max(0, (readingLine - bounds.top) / Math.max(1, bounds.height))) : 0;
};

export default function DarkFigureCloud({ count, stages }: { count: number; stages: MutableRefObject<ParticleStages> }) {
  const { gl, size, viewport, invalidate } = useThree();
  const pointer = useParticlePointer(gl.domElement, true, 1600);
  const cueActive = useRef(darkCueZones.map(() => false));
  const launch = useRef({ dwell: 0, shot: 0, hit: 0, time: 0, blocked: false });
  const doomArrival = useRef<'unseen' | 'armed' | 'played'>('unseen');
  const siteFrame = useRef<HTMLElement | null>(null);
  const [references, setReferences] = useState<(HTMLImageElement | null)[]>();
  const targets = useMemo(() => {
    if (!references) return null;
    const [ironImage, doomImage, throneImage] = references;
    const iron = sampleDarkFigure('iron-man', count, ironImage);
    const doom = sampleDarkFigure('doom', count, doomImage);
    return { iron, doom, seat: throneImage ? sampleDarkFigure('doom-seated', count, throneImage) : doom };
  }, [count, references]);
  const effects = useMemo(() => targets && createDarkFigureEffects([targets.iron.frame, targets.doom.frame, targets.seat.frame]), [targets]);
  const debris = useMemo(createDoomDebris, []);
  const launches = useMemo(createIronLaunchParticles, []);
  const beam = useMemo(createPowerBeam, []);
  const uniforms = useMemo<ShaderMaterial['uniforms']>(() => ({
    uProgress: { value: 0 }, uSit: { value: 0 },
    uIronHeight: { value: 1 }, uDoomHeight: { value: 1 }, uSeatHeight: { value: 1 },
    uStageY: { value: 0 }, uStageVisible: { value: 1 },
    uLane: { value: 0 }, uPointSize: { value: 1 },
    uReveal: { value: 0 }, uTime: { value: 0 },
    uCues: { value: new Float32Array(darkCueZones.length) },
    uCueStart: { value: new Float32Array(darkCueZones.length) },
    uHandCenters: { value: [new Vector2(), new Vector2()] },
    uBrush: { value: new Vector4() },
    uBrushPresence: { value: 0 },
    uCanHover: { value: 0 },
    uProtected: { value: Array.from({ length: 4 }, () => new Vector4()) },
    uBelt: { value: new Vector4() },
    uDebrisTime: { value: 0 },
    uDebrisPower: { value: 0 },
    uDebrisViewport: { value: new Vector2() },
    uIronLaunchPower: { value: 0 },
    uIronLaunchTime: { value: 0 },
    uIronLaunchSide: { value: 1 },
    uActiveStone: { value: -1 },
    uPowerAge: { value: 0 },
    uPowerCharge: { value: 0 },
  }), []);

  useEffect(() => {
    const frame = gl.domElement.closest<HTMLElement>('.site-frame');
    siteFrame.current = frame;
    const reset = () => {
      frame?.removeAttribute('data-iron-sequence');
      launch.current = { dwell: 0, shot: 0, hit: 0, time: 0, blocked: true };
      uniforms.uIronLaunchTime.value = 0;
      uniforms.uIronLaunchPower.value = 0;
    };
    window.addEventListener(ironResetEvent, reset);
    return () => {
      window.removeEventListener(ironResetEvent, reset);
      frame?.removeAttribute('data-doom-debris');
      frame?.removeAttribute('data-doom-arrived');
      frame?.removeAttribute('data-infinity-stone');
      frame?.removeAttribute('data-mobile-stone');
      frame?.removeAttribute('data-iron-sequence');
    };
  }, [gl, uniforms]);

  useEffect(() => {
    const capability = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const update = () => { uniforms.uCanHover.value = Number(capability.matches); };
    update();
    capability.addEventListener('change', update);
    return () => capability.removeEventListener('change', update);
  }, [uniforms]);

  useEffect(() => {
    let active = true;
    void Promise.all(['iron-man-reference', 'doom-standing', 'doom-throne'].map(loadFigureReference))
      .then(images => { if (active) setReferences(images); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!targets) return;
    const { iron, doom, seat } = targets;
    darkCueZones.slice(0, 4).forEach((zone, index) => {
      const frame = zone.pose === 0 ? iron.frame : doom.frame;
      if (!frame) return;
      const [x, y] = zone.center;
      const centerX = (x - frame.centerX) / frame.height;
      const centerY = (frame.centerY - y) / frame.height;
      uniforms.uProtected.value[index].set(centerX, centerY, zone.radius[0] / frame.height, zone.radius[1] / frame.height);
      if (index >= 2) uniforms.uHandCenters.value[index - 2].set(centerX, centerY);
    });
    if (seat.frame && seat.frame !== doom.frame) {
      const { centerX, centerY, height } = seat.frame;
      const [x, y] = throneBelt.center;
      uniforms.uBelt.value.set((x - centerX) / height, (centerY - y) / height, throneBelt.radius[0] / height, throneBelt.radius[1] / height);
    }
  }, [targets, uniforms]);

  const updateDoomArrival = useCallback((progress: number, ready: boolean, frame: HTMLElement | null) => {
    if (doomArrival.current === 'unseen' && progress < 2) doomArrival.current = 'armed';
    if (doomArrival.current === 'armed' && progress === 2 && ready) {
      doomArrival.current = 'played';
      frame?.setAttribute('data-doom-arrived', '');
    } else if (doomArrival.current === 'played' && progress <= 1) {
      doomArrival.current = 'armed';
      frame?.removeAttribute('data-doom-arrived');
    }
  }, []);

  useLayoutEffect(() => {
    const mobile = window.matchMedia(mobileParticleQuery);
    const frameElement = gl.domElement.closest<HTMLElement>('.site-frame');
    const [heroGap, doomGap, throneGap] = ['hero-atlas', 'atlas-projects', 'capabilities-practice']
      .map(name => document.querySelector(`[data-particle-transition="${name}"]`));
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * .46;
      const progress = progressAt(heroGap, line) + progressAt(doomGap, line);
      if (!mobile.matches) {
        uniforms.uProgress.value = progress;
        uniforms.uSit.value = progressAt(throneGap, line);
        updateDoomArrival(progress, Boolean(targets), frameElement);
      }
      invalidate();
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    const main = document.getElementById('main-content');
    if (main) observer.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [gl, invalidate, targets, uniforms, updateDoomArrival]);

  useFrame(({ gl, camera }, delta) => {
    if (!targets) return;
    const { iron, doom, seat } = targets;
    const wide = size.width >= 1024;
    const scale = viewport.width / Math.max(1, size.width);
    const gutter = (size.width - Math.min(size.width - 48, 1200)) / 2;
    const laneWidth = wide ? gutter + (size.width - gutter * 2) * .38 : size.width * .34;
    const lane = laneWidth * scale;
    const { compact, bounds, dark, throne } = stages.current;
    const unitsPerPixel = viewport.height / Math.max(1, size.height);
    const mobileHeight = bounds ? bounds.height * .89 * unitsPerPixel : 0;
    uniforms.uStageVisible.value = Number(!compact || bounds !== null);
    uniforms.uStageY.value = compact && bounds
      ? (gl.domElement.getBoundingClientRect().bottom - (bounds.top + bounds.bottom) / 2 - size.height / 2) * unitsPerPixel : 0;
    uniforms.uLane.value = compact ? 0 : (viewport.width - lane) / 2;
    uniforms.uIronHeight.value = compact ? mobileHeight : Math.min(viewport.height * (wide ? .87 : .65), lane * .80 / Math.max(iron.width, .4));
    uniforms.uDoomHeight.value = compact ? mobileHeight : Math.min(viewport.height * (wide ? .82 : .57), lane * .83 / Math.max(doom.width, .5));
    uniforms.uSeatHeight.value = compact ? mobileHeight : Math.min(uniforms.uDoomHeight.value, lane * .91 / Math.max(seat.width, .5));
    uniforms.uPointSize.value = gl.getPixelRatio() * (wide ? 2.2 : 1.75);
    if (compact) {
      uniforms.uProgress.value = dark;
      uniforms.uSit.value = throne;
    }
    uniforms.uDebrisViewport.value.set(viewport.width, viewport.height);
    const elapsed = Math.min(delta, .05);
    uniforms.uTime.value += elapsed;
    uniforms.uReveal.value = Math.min(1, uniforms.uReveal.value + elapsed / .34);

    const sample = pointer.current;
    const x = sample.x / Math.max(size.width, 1);
    const y = sample.y / Math.max(size.height, 1);
    const active = sample.active && (!compact || bounds !== null) && x >= 0 && x <= 1 && y >= 0 && y <= 1;
    const worldX = (x - .5) * viewport.width;
    const worldY = (y - .5) * viewport.height;
    const brush = uniforms.uBrush.value;
    const blend = 1 - Math.exp(-elapsed * 14);
    if (active) {
      const follow = uniforms.uBrushPresence.value < .005 ? 1 : blend;
      brush.x += (worldX - brush.x) * follow;
      brush.y += (worldY - brush.y) * follow;
    }
    brush.z += (sample.velocity.x / 1600 - brush.z) * blend;
    brush.w += (sample.velocity.y / 1600 - brush.w) * blend;
    sample.velocity.multiplyScalar(Math.exp(-elapsed * 5));

    const progress = uniforms.uProgress.value;
    const frameElement = siteFrame.current;
    if (compact) updateDoomArrival(progress, true, frameElement);
    const sit = uniforms.uSit.value;
    const pose = progress === 0 || progress === 1 ? 0 : progress === 2 && sit === 0 ? 1 : progress === 2 && sit === 1 ? 2 : -1;
    const frame = compact && !bounds ? undefined : pose === 0 ? iron.frame : pose === 1 ? doom.frame : pose === 2 ? seat.frame : undefined;
    const height = pose === 0 ? uniforms.uIronHeight.value : pose === 1 ? uniforms.uDoomHeight.value : uniforms.uSeatHeight.value;
    const centerY = uniforms.uStageY.value + (pose === 2 ? (height - uniforms.uDoomHeight.value) * .5 : 0);
    const centerX = uniforms.uLane.value * (pose === 0 && progress === 1 ? -1 : 1);
    const sourceX = frame ? (worldX - centerX) / height * frame.height + frame.centerX : 0;
    const sourceY = frame ? frame.centerY - (worldY - centerY) / height * frame.height : 0;
    const standingHover = active && pose === 1 && touchesSilhouette(frame, sourceX, sourceY);
    const ironHover = active && pose === 0 && touchesSilhouette(frame, sourceX, sourceY);
    // The stone face projects slightly in front of the sampled armor.
    const stonePerspective = 1 - height * stoneDepth / camera.position.z;
    const stoneX = frame ? sourceX + worldX * (stonePerspective - 1) / height * frame.height : 0;
    const stoneY = frame ? sourceY - worldY * (stonePerspective - 1) / height * frame.height : 0;
    const gauntlet = darkCueZones[1];
    let selectedStone = -1;
    const selection = frameElement?.dataset.mobileStone;
    if (selection) {
      const [index, until] = selection.split(':').map(Number);
      if (!compact || pose !== 0 || performance.now() >= until) frameElement?.removeAttribute('data-mobile-stone');
      else if (bounds) selectedStone = index;
    }
    const hasSelectedStone = selectedStone >= 0;
    const gauntletHover = hasSelectedStone || active && pose === 0 && !!frame
      && (insideCue(sourceX, sourceY, gauntlet) || insideCue(stoneX, stoneY, gauntlet));
    const stoneIndex = hasSelectedStone ? selectedStone : gauntletHover ? findInfinityStone(stoneX, stoneY) : -1;
    // Resolve the gauntlet before advancing the attack, including a pending impact.
    if (gauntletHover && launch.current.time && launch.current.hit < ironShots.length) {
      window.dispatchEvent(new Event(ironResetEvent));
    }
    uniforms.uActiveStone.value = stoneIndex;
    const charging = stoneIndex === 0;
    uniforms.uPowerCharge.value += (Number(charging) - uniforms.uPowerCharge.value) * blend;
    if (charging) uniforms.uPowerAge.value += elapsed;
    else if (uniforms.uPowerCharge.value < .025) uniforms.uPowerAge.value = 0;
    const seatedHover = pose === 2 && seat.frame !== doom.frame && (insideCue(sourceX, sourceY, throneCenter)
      || insideCue(sourceX, sourceY, darkCueZones[4]) || insideCue(sourceX, sourceY, darkCueZones[5]));
    let protectedHover = gauntletHover;
    darkCueZones.forEach((zone, index) => {
      const hovering = index === 1 ? gauntletHover : active && frame !== undefined && pose === zone.pose && (pose === 2 ? seatedHover
        : (pose !== 1 || standingHover) && insideCue(sourceX, sourceY, zone));
      if (pose < 2 && hovering) protectedHover = true;
      if (hovering && !cueActive.current[index]) uniforms.uCueStart.value[index] = uniforms.uTime.value;
      cueActive.current[index] = hovering;
      const strength = uniforms.uCues.value[index];
      const fade = zone.pose === 1 && !hovering ? 1 - Math.exp(-elapsed * 5.5) : blend;
      uniforms.uCues.value[index] = pose === zone.pose ? strength + (Number(hovering) - strength) * fade : 0;
    });
    const brushTarget = Number(pose === 1 ? standingHover : active) * (pose === 2 ? .26 : 1);
    uniforms.uBrushPresence.value = pose >= 0 && !protectedHover
      ? uniforms.uBrushPresence.value + (brushTarget - uniforms.uBrushPresence.value) * blend : 0;

    const power = uniforms.uDebrisPower.value;
    uniforms.uDebrisPower.value = pose === 1 ? power + (Number(standingHover) - power) * (1 - Math.exp(-elapsed * (standingHover ? 6 : 10))) : 0;
    const debrisVisible = uniforms.uDebrisPower.value > .008;
    uniforms.uDebrisTime.value = debrisVisible ? uniforms.uDebrisTime.value + elapsed : 0;
    if (frameElement && frameElement.hasAttribute('data-doom-debris') !== debrisVisible) {
      frameElement.toggleAttribute('data-doom-debris', debrisVisible);
    }
    const stone = stonePowers[stoneIndex];
    if (frameElement && frameElement.dataset.infinityStone !== stone) {
      if (stone) frameElement.dataset.infinityStone = stone;
      else delete frameElement.dataset.infinityStone;
    }

    const sequence = launch.current;
    const firing = ironHover && !protectedHover && (!sample.touch || sample.held);
    if (!firing) sequence.blocked = false;
    if (!sequence.time) {
      sequence.dwell = firing && !sequence.blocked ? sequence.dwell + elapsed : 0;
      uniforms.uIronLaunchSide.value = progress === 1 ? -1 : 1;
      if (sequence.dwell >= .58) {
        sequence.time = elapsed;
        frameElement?.setAttribute('data-iron-sequence', '');
      }
    } else if (sequence.hit < ironShots.length) {
      sequence.time += elapsed;
      const nextLaunch = ironShots[sequence.shot];
      if (nextLaunch && sequence.time >= nextLaunch.start) {
        window.dispatchEvent(new CustomEvent<IronLaunch>(ironLaunchEvent, {
          detail: {
            side: (sequence.shot % 2 === 0 ? 1 : -1) * .18 + uniforms.uIronLaunchSide.value * .4,
            flightSeconds: nextLaunch.hit - nextLaunch.start,
          },
        }));
        sequence.shot++;
      }
      const shot = ironShots[sequence.hit];
      if (sequence.time >= shot.hit) {
        const bounds = gl.domElement.getBoundingClientRect();
        window.dispatchEvent(new CustomEvent<IronImpact>(ironImpactEvent, { detail: {
          x: (bounds.left + shot.x * bounds.width) / window.innerWidth,
          y: (bounds.top + shot.y * bounds.height) / window.innerHeight,
          final: sequence.hit === ironShots.length - 1,
          index: sequence.hit++,
        } }));
      }
    }
    const open = sequence.hit < ironShots.length && (sequence.time > 0 || sequence.dwell > .10);
    uniforms.uIronLaunchPower.value += (Number(open) - uniforms.uIronLaunchPower.value) * blend;
    uniforms.uIronLaunchTime.value = sequence.time;
  });

  if (!targets) return null;

  const { iron, doom, seat } = targets;
  return <><points frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[iron.positions, 3]} />
      <bufferAttribute attach="attributes-aDoom" args={[doom.positions, 3]} />
      <bufferAttribute attach="attributes-aSeat" args={[seat.positions, 3]} />
      <bufferAttribute attach="attributes-aIronDetail" args={[iron.details, 3]} />
      <bufferAttribute attach="attributes-aDoomDetail" args={[doom.details, 3]} />
      <bufferAttribute attach="attributes-aSeatDetail" args={[seat.details, 3]} />
      <bufferAttribute attach="attributes-aIronPaint" args={[iron.paint, 4]} />
      <bufferAttribute attach="attributes-aDoomPaint" args={[doom.paint, 4]} />
      <bufferAttribute attach="attributes-aSeatPaint" args={[seat.paint, 4]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} toneMapped={false} />
  </points>
  {effects && effects.points.length > 0 && <points frustumCulled={false} renderOrder={1}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[effects.points, 3]} />
      <bufferAttribute attach="attributes-aGlow" args={[effects.colors, 3]} />
      <bufferAttribute attach="attributes-aEffect" args={[effects.metadata, 4]} />
      <bufferAttribute attach="attributes-aStone" args={[effects.stoneIndices, 1]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={darkEffectsVertex} fragmentShader={darkEffectsFragment} transparent depthWrite={false} toneMapped={false} />
  </points>}
  <points frustumCulled={false} renderOrder={2}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[debris.points, 3]} />
      <bufferAttribute attach="attributes-aFragment" args={[debris.fragments, 4]} />
      <bufferAttribute attach="attributes-aShade" args={[debris.shades, 1]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={debrisVertex} fragmentShader={darkEffectsFragment} transparent depthWrite={false} toneMapped={false} />
  </points>
  <points frustumCulled={false} renderOrder={3}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[launches.points, 3]} />
      <bufferAttribute attach="attributes-aLaunchPart" args={[launches.parts, 4]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={ironLaunchVertex} fragmentShader={darkEffectsFragment} transparent depthWrite={false} toneMapped={false} />
  </points>
  <points frustumCulled={false} renderOrder={4}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[beam, 3]} />
    </bufferGeometry>
    <shaderMaterial uniforms={uniforms} vertexShader={powerBeamVertex} fragmentShader={darkEffectsFragment} transparent depthWrite={false} toneMapped={false} />
  </points>
  </>;
}
