import { DataTexture, FloatType, NearestFilter, RGBAFormat } from 'three';

export const PARTICLE_LAYOUTS = ['laptop', 'cpu', 'fan', 'java', 'dsa'] as const;
export const LAYOUT_COUNT = PARTICLE_LAYOUTS.length;
export const LAYOUT_TILE_WIDTH = 512;

type LayoutName = (typeof PARTICLE_LAYOUTS)[number];
type Point = [number, number, number];
type TextPixel = [number, number];

const TAU = Math.PI * 2;
const textPixelCache = new Map<string, TextPixel[]>();

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  return ((random() + random() + random() + random() + random() + random()) - 3) * 0.32;
}

function rotateY([x, y, z]: Point, angle: number): Point {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [x * cosine - z * sine, y, x * sine + z * cosine];
}

function rotateX([x, y, z]: Point, angle: number): Point {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [x, y * cosine - z * sine, y * sine + z * cosine];
}

function orient(point: Point, yaw: number, pitch: number): Point {
  return rotateX(rotateY(point, yaw), pitch);
}

function rectanglePoint(width: number, height: number, random: () => number, z = 0): Point {
  return [(random() - 0.5) * width, (random() - 0.5) * height, z + gaussian(random) * 0.025];
}

function rectangleEdgePoint(width: number, height: number, random: () => number, z = 0): Point {
  const side = Math.floor(random() * 4);
  const amount = random() - 0.5;
  if (side === 0) return [amount * width, height / 2, z];
  if (side === 1) return [amount * width, -height / 2, z];
  if (side === 2) return [width / 2, amount * height, z];
  return [-width / 2, amount * height, z];
}

function laptopPoint(index: number, count: number, random: () => number): Point {
  const band = index / count;
  let point: Point;

  // An intentionally readable three-quarter laptop: upright display, hinge,
  // tapered base, discrete keyboard rows, and a centered trackpad.
  if (band < 0.3) {
    const frame = random() < 0.42;
    const local = frame
      ? rectangleEdgePoint(3.18, 1.96, random, -0.5)
      : rectanglePoint(2.88, 1.66, random, -0.53 + gaussian(random) * 0.018);
    point = [local[0], local[1] + 0.78, local[2] - local[1] * 0.15];
  } else if (band < 0.46) {
    const depth = random();
    const width = 3.35 - depth * 0.2;
    point = [(random() - 0.5) * width, -0.3 - depth * 0.25, -0.02 + depth * 1.15];
  } else if (band < 0.88) {
    const column = Math.floor(random() * 13);
    const row = Math.floor(random() * 6);
    const keyX = (column - 6) * 0.23 + (random() - 0.5) * 0.09;
    const keyY = -0.28 - row * 0.075 + (random() - 0.5) * 0.028;
    const keyZ = 0.12 + row * 0.16 + random() * 0.075;
    point = [keyX, keyY, keyZ];
  } else if (band < 0.95) {
    point = [(random() - 0.5) * 0.94, -0.72 + gaussian(random) * 0.024, 0.94 + random() * 0.18];
  } else {
    // Hinge and front lip only. A former rectangular base outline made a
    // detached wireframe appear over the keyboard at some camera angles.
    point = random() < 0.7
      ? [(random() - 0.5) * 3.16, -0.17 + gaussian(random) * 0.022, -0.18]
      : [(random() - 0.5) * 3.05, -0.56 + gaussian(random) * 0.025, 1.18];
  }

  // Pitch exposes the keyboard plane and gives the base visible depth instead
  // of reducing it to a horizontal line beneath the display.
  return orient(point, -0.38, 0.32);
}

function cpuPoint(index: number, count: number, random: () => number): Point {
  const band = index / count;
  let point: Point;

  if (band < 0.29) {
    point = random() < 0.42
      ? rectangleEdgePoint(2.36, 2.36, random, -0.04)
      : rectanglePoint(2.22, 2.22, random, gaussian(random) * 0.035);
  } else if (band < 0.48) {
    point = random() < 0.35
      ? rectangleEdgePoint(0.98, 0.98, random, 0.15)
      : rectanglePoint(0.88, 0.88, random, 0.18 + gaussian(random) * 0.024);
  } else if (band < 0.82) {
    const side = Math.floor(random() * 4);
    const contact = Math.floor(random() * 14);
    const along = -1.02 + contact * (2.04 / 13) + gaussian(random) * 0.03;
    const reach = 1.2 + random() * 0.36;
    const thickness = gaussian(random) * 0.025;
    if (side === 0) point = [along, reach, thickness];
    else if (side === 1) point = [along, -reach, thickness];
    else if (side === 2) point = [reach, along, thickness];
    else point = [-reach, along, thickness];
  } else {
    const side = Math.floor(random() * 4);
    const start = 0.48;
    const end = 1.08;
    const progress = random();
    const along = (random() - 0.5) * 1.1;
    const edge = start + (end - start) * progress;
    if (side === 0) point = [along, edge, 0.08 + gaussian(random) * 0.025];
    else if (side === 1) point = [along, -edge, 0.08 + gaussian(random) * 0.025];
    else if (side === 2) point = [edge, along, 0.08 + gaussian(random) * 0.025];
    else point = [-edge, along, 0.08 + gaussian(random) * 0.025];
  }

  return orient(point, -0.28, 0.11);
}

function fanPoint(index: number, count: number, random: () => number): Point {
  const band = index / count;
  let point: Point;

  if (band < 0.28) {
    const radius = 1.38 + random() * 0.24;
    const angle = random() * TAU;
    point = [Math.cos(angle) * radius, Math.sin(angle) * radius, gaussian(random) * 0.07];
  } else if (band < 0.4) {
    const radius = 1.13 + random() * 0.11;
    const angle = random() * TAU;
    point = [Math.cos(angle) * radius, Math.sin(angle) * radius, 0.05 + gaussian(random) * 0.035];
  } else if (band < 0.88) {
    const blades = 7;
    const blade = Math.floor(random() * blades);
    const outward = Math.sqrt(random());
    const radius = 0.34 + outward * 0.92;
    const angle = blade * TAU / blades + 0.13 + outward * 0.82;
    const tangential = gaussian(random) * (0.075 + outward * 0.12);
    point = [
      Math.cos(angle) * radius - Math.sin(angle) * tangential,
      Math.sin(angle) * radius + Math.cos(angle) * tangential,
      0.07 + gaussian(random) * 0.06,
    ];
  } else if (band < 0.96) {
    const radius = Math.sqrt(random()) * 0.3;
    const angle = random() * TAU;
    point = [Math.cos(angle) * radius, Math.sin(angle) * radius, 0.15 + gaussian(random) * 0.045];
  } else {
    const corner = Math.floor(random() * 4);
    const x = corner < 2 ? (corner === 0 ? -1.28 : 1.28) : (random() - 0.5) * 0.22;
    const y = corner < 2 ? (random() - 0.5) * 0.22 : (corner === 2 ? -1.28 : 1.28);
    point = [x, y, 0.12 + gaussian(random) * 0.04];
  }

  return orient(point, -0.18, 0.07);
}

function getTextPixels(text: string) {
  const cached = textPixelCache.get(text);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  const width = 1280;
  const height = 360;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];

  let size = 258;
  context.font = `900 ${size}px Arial Black, Arial, sans-serif`;
  const maxWidth = width * 0.88;
  size = Math.min(size, Math.floor(size * maxWidth / Math.max(context.measureText(text).width, 1)));
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000';
  context.font = `900 ${size}px Arial Black, Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, width / 2, height / 2 + 6);

  const data = context.getImageData(0, 0, width, height).data;
  const pixels: TextPixel[] = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 128) pixels.push([x, y]);
    }
  }
  textPixelCache.set(text, pixels);
  return pixels;
}

function textPoint(text: 'JAVA' | 'DSA', random: () => number): Point {
  const pixels = getTextPixels(text);
  if (!pixels.length) return [(random() - 0.5) * 3.5, (random() - 0.5) * 1.1, gaussian(random) * 0.05];
  const pixel = pixels[Math.floor(random() * pixels.length)];
  const x = (pixel[0] / 1280 - 0.5) * 4.35 + gaussian(random) * 0.008;
  const y = (0.5 - pixel[1] / 360) * 1.28 + gaussian(random) * 0.008;
  const z = gaussian(random) * 0.075 + (random() > 0.73 ? 0.08 : 0);
  return orient([x, y, z], -0.08, 0.02);
}

function makeLayout(name: LayoutName, count: number) {
  const random = seededRandom(7919);
  const points = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const point = name === 'laptop'
      ? laptopPoint(index, count, random)
      : name === 'cpu'
        ? cpuPoint(index, count, random)
        : name === 'fan'
          ? fanPoint(index, count, random)
          : textPoint(name === 'java' ? 'JAVA' : 'DSA', random);
    const offset = index * 3;
    points[offset] = point[0];
    points[offset + 1] = point[1];
    points[offset + 2] = point[2];
  }
  return points;
}

export function createParticleLayouts(count: number) {
  return PARTICLE_LAYOUTS.map((name) => makeLayout(name, count));
}

export function createSeedAttributes(count: number) {
  const random = seededRandom(1907);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const index = new Float32Array(count);
  for (let particle = 0; particle < count; particle += 1) {
    index[particle] = particle;
    seed[particle] = random();
    tone[particle] = random();
  }
  return { index, seed, tone };
}

export function createLayoutTexture(layouts: Float32Array[], count: number) {
  const rowsPerLayout = Math.ceil(count / LAYOUT_TILE_WIDTH);
  const height = rowsPerLayout * LAYOUT_COUNT;
  const packed = new Float32Array(LAYOUT_TILE_WIDTH * height * 4);

  layouts.forEach((points, layoutIndex) => {
    for (let particle = 0; particle < count; particle += 1) {
      const source = particle * 3;
      const row = layoutIndex * rowsPerLayout + Math.floor(particle / LAYOUT_TILE_WIDTH);
      const column = particle % LAYOUT_TILE_WIDTH;
      const destination = (row * LAYOUT_TILE_WIDTH + column) * 4;
      packed[destination] = points[source];
      packed[destination + 1] = points[source + 1];
      packed[destination + 2] = points[source + 2];
      packed[destination + 3] = 1;
    }
  });

  const texture = new DataTexture(packed, LAYOUT_TILE_WIDTH, height, RGBAFormat, FloatType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return { texture, rowsPerLayout, height };
}
