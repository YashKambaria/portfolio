import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Ref = MutableRefObject<THREE.Group | null>;

const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 1);
const ease = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

function seeded(seed = 19) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) & 0xfffffff) / 0xfffffff;
  };
}

const palette = {
  red: '#8e1522',
  redHot: '#c82839',
  gold: '#b6975d',
  silver: '#b9c2cc',
  carbon: '#111821',
};

function Plate({ position, scale, rotation, color = palette.red, radius = .13, partRef, children }: {
  position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number]; color?: string; radius?: number; partRef?: Ref; children?: ReactNode;
}) {
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 5, radius), [radius]);
  return <group ref={partRef} position={position} rotation={rotation}>
    <mesh scale={scale} castShadow receiveShadow geometry={geometry}>
      <meshPhysicalMaterial color={color} metalness={.96} roughness={.19} clearcoat={1} clearcoatRoughness={.12} />
    </mesh>
    {children}
  </group>;
}

function Joint({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.17, .17, .24, 16]} /><meshPhysicalMaterial color={palette.carbon} metalness={1} roughness={.24} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.18, .026, 8, 20]} /><meshBasicMaterial color="#6f8293" /></mesh>
  </group>;
}

function makeBurstGeometry(count: number, seedValue: number) {
  const random = seeded(seedValue);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 1.35;
    positions.set([Math.cos(angle) * radius, random() * .16, Math.sin(angle) * radius], index * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

/** Original procedural exosuit: articulated geometry provides the choreography;
 * particle surfaces and effects remain the primary visual treatment. */
export default function ArmoredHero({ progress, reducedMotion, active }: { progress: MutableRefObject<number>; reducedMotion: boolean; active: boolean }) {
  const { viewport, gl } = useThree();
  const root = useRef<THREE.Group | null>(null);
  const helmet = useRef<THREE.Group | null>(null);
  const face = useRef<THREE.Group | null>(null);
  const torso = useRef<THREE.Group | null>(null);
  const leftUpperArm = useRef<THREE.Group | null>(null);
  const rightUpperArm = useRef<THREE.Group | null>(null);
  const leftForearm = useRef<THREE.Group | null>(null);
  const rightForearm = useRef<THREE.Group | null>(null);
  const leftLeg = useRef<THREE.Group | null>(null);
  const rightLeg = useRef<THREE.Group | null>(null);
  const dust = useRef<THREE.Group | null>(null);
  const sparks = useRef<THREE.Group | null>(null);
  const dustGeometry = useMemo(() => makeBurstGeometry(420, 113), []);
  const sparkGeometry = useMemo(() => makeBurstGeometry(120, 991), []);

  useFrame((state) => {
    if (!active || !root.current || !helmet.current) return;
    const p = reducedMotion ? 0 : progress.current;
    const launch = ease((p - 1.55) / .62);
    const flip = ease((p - 2.05) / .9);
    const descend = ease((p - 3.05) / .85);
    const land = ease((p - 3.95) / .72);
    const tuck = Math.sin(clamp((p - 2.08) / .84) * Math.PI);
    const stage = Math.min(5, Math.floor(p));
    const next = Math.min(5, stage + 1);
    const lane = (index: number) => [1, -1, 1, -1, 1, 1][index] ?? 1;
    const local = ease(p - stage);
    const side = THREE.MathUtils.lerp(lane(stage), lane(next), local);
    const landingY = -1.65 * land;

    root.current.position.set(side * viewport.width * .275, .16 + launch * 2.45 - descend * 2.45 + landingY, 0);
    root.current.rotation.set(0.08 * Math.sin(p * 1.3), 0.18 * Math.sin(p * .8), -flip * Math.PI * 2 + land * .34);
    root.current.scale.setScalar(Math.min(1.28, viewport.height / 5.1));

    if (torso.current) torso.current.rotation.x = -.12 * launch + .27 * tuck + .38 * land;
    if (leftUpperArm.current) leftUpperArm.current.rotation.z = .34 + tuck * .7 - land * 1.55;
    if (rightUpperArm.current) rightUpperArm.current.rotation.z = -.34 - tuck * .7 + land * .28;
    if (leftForearm.current) leftForearm.current.rotation.z = -.25 - tuck * .65 - land * .72;
    if (rightForearm.current) rightForearm.current.rotation.z = .25 + tuck * .65 + land * .7;
    if (leftLeg.current) leftLeg.current.rotation.x = tuck * 1.12 - land * .82;
    if (rightLeg.current) rightLeg.current.rotation.x = tuck * 1.05 + land * .68;

    // Faceplate remains a world-space actor until the aerial catch-up. Its
    // path counters the body's initial travel, then converges during the flip.
    // Hero is open-faced. The separate faceplate does not exist visually
    // until the CPU/Atlas beat, where it enters from the counter lane.
    const detach = ease((p - .9) / .72);
    const lock = ease((p - 2.56) / .44);
    const bodyHead = root.current.position.clone().add(new THREE.Vector3(0, 1.62 * root.current.scale.x, .08));
    const flight = new THREE.Vector3(
      -side * viewport.width * (.33 + .04 * Math.sin(p * Math.PI)),
      1.2 + Math.sin(p * 2.5) * .55,
      .55 + Math.cos(p * 2.1) * .42,
    );
    const openPosition = bodyHead.clone().add(new THREE.Vector3(.08, .02, .34));
    const detachedPosition = openPosition.clone().lerp(flight, detach);
    helmet.current.position.copy(detachedPosition.lerp(bodyHead, lock));
    helmet.current.rotation.set(.18 + p * 2.7 * (1 - lock), p * 4.1 * (1 - lock), .18 - p * 5.6 * (1 - lock));
    helmet.current.scale.setScalar(root.current.scale.x);
    helmet.current.visible = p > .86;
    if (face.current) face.current.visible = lock < .96;

    const impact = clamp((land - .58) / .42);
    if (dust.current) { dust.current.position.copy(root.current.position).add(new THREE.Vector3(0, -1.82 * root.current.scale.x, 0)); dust.current.scale.setScalar(.2 + impact * 1.5); dust.current.visible = impact > .01; }
    if (sparks.current) { sparks.current.position.copy(root.current.position).add(new THREE.Vector3(0, -1.72 * root.current.scale.x, .08)); sparks.current.rotation.y = state.clock.elapsedTime * 1.2; sparks.current.scale.setScalar(impact); sparks.current.visible = impact > .04; }
    gl.setClearAlpha(0);
  });

  return <group>
    <ambientLight color="#9bb7d0" intensity={.72} />
    <directionalLight position={[2.4, 4.8, 4]} color="#dce8ff" intensity={1.25} />
    <pointLight position={[-3, 1, 3]} color="#b83342" intensity={2.2} distance={7} />
    <group ref={root}>
      {/* A plated silhouette: every visible volume has a panel break or a joint. */}
      <Plate partRef={torso} position={[0, .24, -.04]} scale={[1.27, 1.78, .58]} color={palette.carbon} radius={.2}>
        <Plate position={[-.34, .48, .32]} scale={[.59, .7, .12]} rotation={[0, 0, -.12]} color={palette.gold} radius={.07} />
        <Plate position={[.34, .48, .32]} scale={[.59, .7, .12]} rotation={[0, 0, .12]} color={palette.gold} radius={.07} />
        <Plate position={[-.34, .48, .39]} scale={[.43, .48, .06]} rotation={[0, 0, -.13]} color={palette.red} radius={.04} />
        <Plate position={[.34, .48, .39]} scale={[.43, .48, .06]} rotation={[0, 0, .13]} color={palette.red} radius={.04} />
        <Plate position={[0, .47, .43]} scale={[.17, 1.16, .08]} color={palette.silver} radius={.03} />
        {[.12, -.16, -.44].map((y) => <Plate key={y} position={[0, y, .35]} scale={[.79 - Math.abs(y) * .25, .22, .12]} color={palette.gold} radius={.04} />)}
      </Plate>
      <Plate position={[0, 1.54, -.04]} scale={[.59, .68, .5]} color={palette.carbon} radius={.18} />
      <group ref={face} position={[0, 1.5, .3]}>
        <Plate position={[0, .18, .01]} scale={[.5, .28, .14]} color={palette.red} radius={.08} />
        <Plate position={[-.26, -.04, .03]} rotation={[0, 0, -.18]} scale={[.1, .57, .12]} color={palette.gold} radius={.04} />
        <Plate position={[.26, -.04, .03]} rotation={[0, 0, .18]} scale={[.1, .57, .12]} color={palette.gold} radius={.04} />
        <mesh position={[0, -.03, .11]} scale={[.22, .28, .06]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#3a2727" roughness={.72} /></mesh>
      </group>
      <Plate position={[-.74, .82, .02]} scale={[.64, .39, .59]} rotation={[0, 0, -.08]} color={palette.gold} radius={.16} />
      <Plate position={[.74, .82, .02]} scale={[.64, .39, .59]} rotation={[0, 0, .08]} color={palette.gold} radius={.16} />
      <Joint position={[-.84, .52, .04]} /><Joint position={[.84, .52, .04]} />
      <Plate partRef={leftUpperArm} position={[-.96, .28, 0]} scale={[.38, .94, .4]} rotation={[0, 0, .34]} color={palette.red} radius={.13}>
        <Plate position={[0, .04, .23]} scale={[.27, .68, .07]} color={palette.gold} radius={.04} />
      </Plate>
      <Plate partRef={rightUpperArm} position={[.96, .28, 0]} scale={[.38, .94, .4]} rotation={[0, 0, -.34]} color={palette.red} radius={.13}>
        <Plate position={[0, .04, .23]} scale={[.27, .68, .07]} color={palette.gold} radius={.04} />
      </Plate>
      <Joint position={[-1.13, -.24, .04]} /><Joint position={[1.13, -.24, .04]} />
      <Plate partRef={leftForearm} position={[-1.19, -.5, .06]} scale={[.34, .78, .39]} rotation={[0, 0, -.25]} color={palette.silver} radius={.1} />
      <Plate partRef={rightForearm} position={[1.19, -.5, .06]} scale={[.34, .78, .39]} rotation={[0, 0, .25]} color={palette.silver} radius={.1} />
      <Plate position={[0, -.85, 0]} scale={[.95, .42, .55]} color={palette.red} radius={.12} />
      <Plate partRef={leftLeg} position={[-.38, -1.52, 0]} scale={[.44, 1.24, .49]} color={palette.red} radius={.13}>
        <Plate position={[0, -.12, .29]} scale={[.3, .72, .07]} color={palette.gold} radius={.04} />
        <Plate position={[0, -.68, .05]} scale={[.53, .24, .56]} color={palette.carbon} radius={.1} />
      </Plate>
      <Plate partRef={rightLeg} position={[.38, -1.52, 0]} scale={[.44, 1.24, .49]} color={palette.red} radius={.13}>
        <Plate position={[0, -.12, .29]} scale={[.3, .72, .07]} color={palette.gold} radius={.04} />
        <Plate position={[0, -.68, .05]} scale={[.53, .24, .56]} color={palette.carbon} radius={.1} />
      </Plate>
      <mesh position={[0, .4, .43]}><sphereGeometry args={[.14, 24, 24]} /><meshBasicMaterial color="#eaf8ff" transparent opacity={.98} /></mesh>
      <mesh position={[0, .4, .405]}><torusGeometry args={[.18, .026, 10, 32]} /><meshBasicMaterial color="#8cd9ff" /></mesh>
      <pointLight position={[0, .4, .75]} color="#d9f5ff" intensity={1.7} distance={3.3} />
      <pointLight position={[-.38, -2.35, .15]} color="#b7432e" intensity={1.5} distance={2.4} />
      <pointLight position={[.38, -2.35, .15]} color="#b7432e" intensity={1.5} distance={2.4} />
    </group>
    <group ref={helmet}>
      <Plate position={[0, .19, 0]} scale={[.59, .3, .35]} color={palette.red} radius={.12} />
      <Plate position={[0, -.03, .16]} scale={[.53, .39, .16]} color={palette.gold} radius={.08} />
      <Plate position={[0, -.33, .08]} scale={[.34, .16, .15]} color={palette.gold} radius={.05} />
      <Plate position={[-.31, -.05, .05]} rotation={[0, 0, -.17]} scale={[.12, .57, .25]} color={palette.redHot} radius={.04} />
      <Plate position={[.31, -.05, .05]} rotation={[0, 0, .17]} scale={[.12, .57, .25]} color={palette.redHot} radius={.04} />
      <mesh position={[-.13, -.01, .255]} rotation={[0, 0, -.16]} scale={[.14, .032, .025]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#c9f5ff" /></mesh>
      <mesh position={[.13, -.01, .255]} rotation={[0, 0, .16]} scale={[.14, .032, .025]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#c9f5ff" /></mesh>
    </group>
    <group ref={dust}><points geometry={dustGeometry}><pointsMaterial color="#a65b45" size={.032} transparent opacity={.55} depthWrite={false} /></points></group>
    <group ref={sparks}><points geometry={sparkGeometry}><pointsMaterial color="#f3a257" size={.042} transparent opacity={.9} depthWrite={false} /></points></group>
  </group>;
}
