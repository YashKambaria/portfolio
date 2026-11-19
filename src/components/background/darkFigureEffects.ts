import type { FigureFrame } from './darkFigurePoints';

type Pair = readonly [number, number];
type Color = readonly [number, number, number];

// Coordinates are measured in the three existing reference images. The same
// figure frames used to sample the silhouettes project these cues on screen.
export const darkCueZones = [
  { pose: 0, center: [170, 162], radius: [38, 38] },
  { pose: 0, center: [45, 328], radius: [34, 35] }, // Iron Man's right hand
  { pose: 1, center: [54, 430], radius: [42, 47] },
  { pose: 1, center: [322, 420], radius: [42, 47] },
  { pose: 2, center: [43, 365], radius: [37, 45] },
  { pose: 2, center: [294, 365], radius: [37, 45] },
] as const;

export const throneCenter = { center: [167, 343], radius: [155, 213] } as const;
export const throneBelt = { center: [169, 350], radius: [40, 12] } as const;
const throneEyes = [[184.5, 240.5, .20, 8.0], [201.5, 242, .10, 7.5]] as const;
const standingEyes = [[170, 62, .10, 16], [202, 62, -.13, 15]] as const;
export const stoneDepth = .008;
export const stonePowers = ['power', 'space', 'reality', 'soul', 'time', 'mind'] as const;

export function insideCue(x: number, y: number, zone: { center: Pair; radius: Pair }) {
  return Math.hypot((x - zone.center[0]) / zone.radius[0], (y - zone.center[1]) / zone.radius[1]) < 1;
}

const reactorBlue = [.65, .90, 1] as const;
const emerald = [.37, 1, .60] as const;
const stones = [
  { center: [30, 332], color: [.77, .40, 1], vein: [[31, 313], [33, 297], [29, 280], [33, 254]] },
  { center: [38, 335], color: [.31, .71, 1], vein: [[38, 317], [37, 306], [42, 288], [43, 269], [50, 247]] },
  { center: [46, 336], color: [1, .31, .38], vein: [[46, 319], [47, 305], [48, 286], [54, 273], [48, 254]] },
  { center: [54, 329], color: [1, .56, .23], vein: [[50, 317], [54, 299], [50, 281], [55, 260], [56, 236]] },
  { center: [33, 343], color: [.36, .94, .51], vein: [[33, 323], [28, 306], [26, 286], [29, 263], [38, 239]] },
  { center: [46, 347], color: [1, .84, .30], vein: [[40, 325], [43, 306], [39, 290], [36, 271], [43, 251], [45, 230]] },
] as const;

export function findInfinityStone(x: number, y: number) {
  let closest = -1;
  let limit = 7.5;
  stones.forEach(({ center: [cx, cy] }, index) => {
    const distance = Math.hypot(x - cx, y - cy);
    if (distance < limit) {
      closest = index;
      limit = distance;
    }
  });
  return closest;
}

export function createDarkFigureEffects(frames: readonly (FigureFrame | undefined)[]) {
  const points: number[] = [];
  const colors: number[] = [];
  const metadata: number[] = [];
  const stoneIndices: number[] = [];
  let seed = 4079;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function add(cue: number, x: number, y: number, color: Color, phase: number, size: number, stone = -1) {
    const frame = frames[darkCueZones[cue].pose];
    if (!frame) return;
    // Keep the eye dots on the mask's own plane so perspective doesn't move them sideways.
    points.push((x - frame.centerX) / frame.height, (frame.centerY - y) / frame.height, phase >= 3 || stone >= 0 ? stoneDepth : .024);
    colors.push(...color);
    metadata.push(cue, phase, size, random());
    stoneIndices.push(stone);
  }

  function trace(cue: number, line: readonly Pair[], color: Color, density = 1, offset = 0, span = 1, stone = -1) {
    const lengths = line.slice(1).map(([x, y], i) => Math.hypot(x - line[i][0], y - line[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let traveled = 0;
    lengths.forEach((length, index) => {
      const [x, y] = line[index];
      const [nextX, nextY] = line[index + 1];
      const count = Math.ceil(length * density);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        add(cue, x + (nextX - x) * t + (random() - .5) * 2.6, y + (nextY - y) * t + (random() - .5) * 2.6,
          color, offset + (traveled + t * length) / total * span, .72 + random() * .62, stone);
      }
      traveled += length;
    });
  }

  function cluster(cue: number, [x, y]: Pair, color: Color, radius: number, count: number, stone = -1) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const r = radius * Math.sqrt(random());
      add(cue, x + Math.cos(angle) * r, y + Math.sin(angle) * r, color, 0, 1.7 + random() * .7, stone);
    }
  }

  // Open brackets mark the real hover targets without tracing over the faces.
  darkCueZones.forEach(({ center: [x, y] }, cue) => {
    const radius = cue < 2 ? 21 : 26;
    const tint = cue < 2 ? [.98, .78, .50] as const : emerald;
    for (let quarter = 0; quarter < 4; quarter++) {
      for (let i = 0; i < 10; i++) {
        const angle = quarter * Math.PI * .5 + .22 + i * .067;
        add(cue, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, tint, -1, 1.04);
      }
    }
  });

  cluster(0, [170, 162], reactorBlue, 13, 66);
  trace(0, [[170, 162], [145, 156], [114, 131], [85, 112], [64, 146], [53, 198], [43, 226], [34, 278], [44, 326]], reactorBlue, 1.2);
  trace(0, [[170, 162], [205, 150], [225, 125], [244, 135], [254, 192], [261, 221], [277, 254], [275, 316]], reactorBlue, 1.2);
  trace(0, [[170, 162], [148, 188], [121, 203], [133, 232], [145, 264]], reactorBlue, 1.1, 0, .65);
  trace(0, [[170, 162], [191, 185], [212, 201], [202, 234], [189, 256]], reactorBlue, 1.1, 0, .65);

  stones.forEach((stone, index) => {
    cluster(1, stone.center, stone.color, 3.1, 27, index);
    trace(1, [stone.center, ...stone.vein], stone.color, 1.65, 0, 1, index);
    const [x, y] = stone.vein[2];
    const [endX, endY] = stone.vein[3];
    trace(1, [[x, y], [endX + 6, y - 7], [endX + 4, endY - 5]], stone.color, 1.25, .33, .35, index);
  });

  for (const cue of [2, 3]) {
    const [x, y] = darkCueZones[cue].center;
    for (let i = 0; i < 460; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 25 + (i % 3) * 14 + random() * 7;
      add(cue, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * .62, emerald, angle / (Math.PI * 2), .82 + random() * 1.03);
    }
    cluster(cue, [x, y], emerald, 10, 42);
  }
  trace(2, [[54, 430], [38, 402], [48, 364], [52, 336], [59, 293], [70, 256], [84, 215]], emerald, 1.55, 1.2, 1);
  trace(2, [[51, 409], [61, 388], [58, 365], [67, 338]], emerald, 1.35, 1.34, .35);
  trace(3, [[322, 420], [338, 391], [324, 357], [323, 320], [315, 280], [304, 251], [290, 212]], emerald, 1.55, 1.2, 1);
  trace(3, [[327, 401], [312, 376], [316, 354], [302, 328]], emerald, 1.35, 1.34, .35);

  for (const { cue, phase, openings } of [{ cue: 4, phase: 3, openings: throneEyes }, { cue: 2, phase: 4, openings: standingEyes }]) {
    for (const [x, y, tilt, width] of openings) {
      for (let i = 0; i < 38; i++) {
        const offset = (random() - .5) * width;
        add(cue, x + offset, y + offset * tilt + (random() - .5) * 1.6, [.63, 1, .73], phase, .8 + random() * .47);
      }
    }
  }
  return {
    points: new Float32Array(points),
    colors: new Float32Array(colors),
    metadata: new Float32Array(metadata),
    stoneIndices: new Float32Array(stoneIndices),
  };
}

export const darkEffectsVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uSit;
  uniform float uIronHeight;
  uniform float uDoomHeight;
  uniform float uSeatHeight;
  uniform float uLane;
  uniform float uPointSize;
  uniform float uReveal;
  uniform float uTime;
  uniform float uCanHover;
  uniform float uDebrisPower;
  uniform float uActiveStone;
  uniform float uCues[6];
  uniform float uCueStart[6];
  uniform vec2 uHandCenters[2];
  attribute vec3 aGlow;
  attribute vec4 aEffect;
  attribute float aStone;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    int cue = int(aEffect.x);
    bool iron = cue < 2;
    bool hands = cue >= 2 && cue < 4;
    bool posed = iron ? uProgress <= 1.0 : uProgress >= 2.0 && (hands ? uSit <= 0.0 : uSit >= 1.0);
    bool marker = aEffect.y < 0.0;
    bool eyes = aEffect.y >= 3.0 && aEffect.y < 5.0;
    float hover = hands && eyes ? uDebrisPower : eyes ? max(uCues[4], uCues[5]) : uCues[cue];
    float strength = posed ? (marker ? uCanHover * (1.0 - hover * .8) : hover) * uReveal : 0.0;
    if (strength < .005) {
      vAlpha = 0.0;
      vColor = vec3(0.0);
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 1.0;
      return;
    }

    vec3 point = position;
    float elapsed = max(0.0, uTime - uCueStart[cue]);
    float phase = fract(elapsed * (iron ? .85 : .67));
    float difference = phase - (aEffect.y > 1.0 ? aEffect.y - 1.2 : aEffect.y);
    float wave = exp(-difference * difference * 22.0);
    float intensity = .17 + .77 * wave;
    if (aEffect.z > 1.7) {
      intensity = .65 + .35 * sin(elapsed * 3.0 + aEffect.w);
    }

    if (hands && !marker && aEffect.y <= 1.0) {
      vec2 center = uHandCenters[cue - 2];
      float angle = elapsed * (cue == 2 ? 1.55 : -1.55);
      float loose = 1.0 - strength;
      vec2 local = (point.xy - center) * mix(1.48, .93, strength);
      local.y /= .62;
      local = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * local;
      local.y *= .62;
      // The outer particles unwind down and inward toward the cape as the cue fades.
      point.xy = center + local + vec2(cue == 2 ? .039 : -.039, -.076) * loose;
      intensity = .34 + .66 * pow(.5 + .5 * sin(elapsed * 3.8 + aEffect.y * 18.85), 2.0);
    }
    if (!iron && !marker) intensity = .17 + intensity * .90;
    if (marker) intensity = .60 + .13 * sin(uTime * 2.1);
    if (eyes) intensity = .93 + .07 * sin(uTime * 2.4);
    if (aStone >= 0.0 && uActiveStone >= 0.0) {
      float selected = 1.0 - step(.5, abs(aStone - uActiveStone));
      intensity = mix(aEffect.z > 1.7 ? .38 : .10, .63 + .37 * wave, selected);
    }

    float height = iron ? uIronHeight : hands ? uDoomHeight : uSeatHeight;
    point *= height;
    point.x += iron && uProgress >= 1.0 ? -uLane : uLane;
    if (!iron && !hands) point.y += (uSeatHeight - uDoomHeight) * .5;
    vec4 view = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = uPointSize * aEffect.z * (8.0 / -view.z);
    vColor = mix(aGlow, vec3(.93, 1.0, .97), wave * .18);
    vAlpha = intensity * strength;
  }
`;

export const darkEffectsFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - .5) * 2.0;
    float alpha = vAlpha * (1.0 - smoothstep(.22, 1.0, radius));
    if (alpha < .01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
