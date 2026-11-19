import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { ShaderMaterial } from 'three';
import { loadFigureReference, sampleDarkFigure } from './darkFigurePoints';
import { particleMotion } from './particleMotion';

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uSit;
  uniform float uIronHeight;
  uniform float uDoomHeight;
  uniform float uSeatHeight;
  uniform float uLane;
  uniform float uPointSize;
  uniform float uReveal;
  uniform float uTime;
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
    vec3 armor = min(vec3(1.0), pow(paint.rgb, vec3(.58)) * tint);
    return mix(base, armor, photo * .86);
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
    vec3 doom = doomColor(aDoomPaint, aDoomDetail);
    vec3 throne = doomColor(aSeatPaint, aSeatDetail);
    vColor = mix(iron, mix(doom, throne, pose), morph);
    float ironAlpha = mix(mix(.18, .93, aIronDetail.x), .86 + .13 * eye, painted);
    float standingAlpha = mix(.37, .93, aDoomDetail.x);
    float seatedAlpha = mix(.40, .94, aSeatDetail.x);
    float cloudOpacity = 1.0 - .26 * spread * (1.0 - gather);
    vAlpha = mix(ironAlpha, mix(standingAlpha, seatedAlpha, pose) * cloudOpacity, morph);
    vAlpha *= (1.0 - burst * .32) * ease(uReveal) * (1.0 + motion.w * mix(.13, .025, anchor));
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

export default function DarkFigureCloud({ count }: { count: number }) {
  const { size, viewport, invalidate } = useThree();
  const [references, setReferences] = useState<(HTMLImageElement | null)[]>();
  const targets = useMemo(() => {
    if (!references) return null;
    const [ironImage, doomImage, throneImage] = references;
    const iron = sampleDarkFigure('iron-man', count, ironImage);
    const doom = sampleDarkFigure('doom', count, doomImage);
    return { iron, doom, seat: throneImage ? sampleDarkFigure('doom-seated', count, throneImage) : doom };
  }, [count, references]);
  const uniforms = useMemo<ShaderMaterial['uniforms']>(() => ({
    uProgress: { value: 0 }, uSit: { value: 0 },
    uIronHeight: { value: 1 }, uDoomHeight: { value: 1 }, uSeatHeight: { value: 1 },
    uLane: { value: 0 }, uPointSize: { value: 1 },
    uReveal: { value: 0 }, uTime: { value: 0 },
  }), []);

  useEffect(() => {
    let active = true;
    void Promise.all(['iron-man-reference', 'doom-standing', 'doom-throne'].map(loadFigureReference))
      .then(images => { if (active) setReferences(images); });
    return () => { active = false; };
  }, []);

  useLayoutEffect(() => {
    const [heroGap, doomGap, throneGap] = ['hero-atlas', 'atlas-projects', 'capabilities-practice']
      .map(name => document.querySelector(`[data-particle-transition="${name}"]`));
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * .46;
      uniforms.uProgress.value = progressAt(heroGap, line) + progressAt(doomGap, line);
      uniforms.uSit.value = progressAt(throneGap, line);
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
  }, [invalidate, uniforms]);

  useFrame(({ gl }, delta) => {
    if (!targets) return;
    const { iron, doom, seat } = targets;
    const wide = size.width >= 1024;
    const scale = viewport.width / Math.max(1, size.width);
    const gutter = (size.width - Math.min(size.width - 48, 1200)) / 2;
    const laneWidth = wide ? gutter + (size.width - gutter * 2) * .38 : size.width * .34;
    const lane = laneWidth * scale;
    uniforms.uLane.value = (viewport.width - lane) / 2;
    uniforms.uIronHeight.value = Math.min(viewport.height * (wide ? .87 : .65), lane * .80 / Math.max(iron.width, .4));
    uniforms.uDoomHeight.value = Math.min(viewport.height * (wide ? .82 : .57), lane * .83 / Math.max(doom.width, .5));
    uniforms.uSeatHeight.value = Math.min(uniforms.uDoomHeight.value, lane * .91 / Math.max(seat.width, .5));
    uniforms.uPointSize.value = gl.getPixelRatio() * (wide ? 2.2 : 1.75);
    const elapsed = Math.min(delta, .05);
    uniforms.uTime.value += elapsed;
    uniforms.uReveal.value = Math.min(1, uniforms.uReveal.value + elapsed / .34);
  });

  if (!targets) return null;

  const { iron, doom, seat } = targets;
  return <points frustumCulled={false}>
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
  </points>;
}
