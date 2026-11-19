import { buildDoctorDoomCanvas, buildExoSuitCanvas } from './darkFigureDrawings';

export type DarkFigure = 'iron-man' | 'doom' | 'doom-seated';
type Sample = { x: number; y: number; light: number; edge: number; anchor: number; face: number; weight: number; paint?: [number, number, number, number] };

const fields = new Map<DarkFigure, { width: number; samples: Sample[]; throne: Sample[]; regions: Sample[][] }>();

const references = new Map<string, Promise<HTMLImageElement | null>>();

export function loadFigureReference(name: string) {
  const cached = references.get(name);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement | null>(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = `/assets/${name}.png`;
  });
  references.set(name, pending);
  return pending;
}

function readThroneReference(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  // Trace the throne, statues and cape in the supplied image. Keep the
  // windows, walls and floor outside the point cloud.
  const silhouette = new Path2D('M17 550 L12 528 L22 494 L22 407 L13 381 Q10 352 28 332 L59 312 L62 229 L52 202 L54 171 L70 145 L94 157 L106 180 Q129 148 169 126 Q206 147 225 177 L246 151 L267 153 L281 174 L281 202 L268 223 L268 273 L280 301 L281 329 L302 331 L321 349 L323 375 L313 414 L318 488 L324 525 L333 548 L333 566 L22 566 Z');
  context.clip(silhouette);
  context.drawImage(image, 0, 0);
  return canvas;
}

function readReference(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  const { width, height } = canvas;
  context.drawImage(image, 0, 0);
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  // Remove only border-connected white. The eyes and chest reactor are
  // enclosed by armor, so their bright pixels remain available to sample.
  const visit = (index: number) => {
    const offset = index * 4;
    if (!pixels[offset + 3]) return;
    const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
    const darkest = Math.min(r, g, b);
    if (darkest < 212 || Math.max(r, g, b) - darkest > 28) return;
    pixels[offset + 3] = 0;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < (height - 1) * width) visit(index + width);
  }
  // Soften the remaining pale antialias pixels at the cutout boundary.
  for (let index = 0; index < queue.length; index++) {
    const offset = index * 4;
    if (pixels[offset + 3] !== 255) continue;
    const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
    const darkest = Math.min(r, g, b);
    if (darkest < 164 || Math.max(r, g, b) - darkest > 22) continue;
    const x = index % width;
    const touchesBackdrop =
      (x > 0 && pixels[offset - 1] === 0) ||
      (x < width - 1 && pixels[offset + 7] === 0) ||
      (index >= width && pixels[offset - width * 4 + 3] === 0) ||
      (index < (height - 1) * width && pixels[offset + width * 4 + 3] === 0);
    if (touchesBackdrop) pixels[offset + 3] = 40;
  }
  context.putImageData(frame, 0, 0);
  return canvas;
}

function readFigure(figure: DarkFigure, reference: HTMLImageElement | null) {
  const cached = fields.get(figure);
  if (cached) return cached;

  const iron = figure === 'iron-man';
  const seated = figure === 'doom-seated' && reference !== null;
  const fromPhoto = reference !== null;
  const canvas = reference ? (seated ? readThroneReference(reference) : readReference(reference))
    : iron ? buildExoSuitCanvas() : buildDoctorDoomCanvas();
  const { width, height } = canvas;
  const context = canvas.getContext('2d');
  const pixels = context?.getImageData(0, 0, width, height).data;
  const samples: Sample[] = [];
  const throne: Sample[] = [];
  const regions: Sample[][] = [[], [], []];
  const regionWeights = [0, 0, 0];
  if (!pixels || !context) return { width: 0, samples, throne, regions };
  const seatedBody = seated ? new Path2D('M129 255 Q146 238 154 222 Q171 193 189 204 Q211 203 224 243 L240 251 L264 278 L283 302 L277 336 L256 351 L268 383 L263 425 L258 461 L258 505 L273 537 L278 559 L225 563 L205 547 L171 545 L115 542 L105 555 L62 564 L54 550 L66 529 L76 494 L78 448 L71 400 L80 367 L77 351 L60 353 L51 362 L22 356 L25 336 L50 321 L82 306 L99 277 Z') : null;

  const luminance = new Float32Array(width * height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const offset = index * 4;
      if (pixels[offset + 3] < 96) continue;
      luminance[index] = (pixels[offset] * .299 + pixels[offset + 1] * .587 + pixels[offset + 2] * .114) / 255;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  // Sample the original artwork's silhouette, luminance and Sobel edges.
  // Order by horizontal bands so matching particle indices stay near the
  // same part of each figure instead of crossing from head to foot.
  const figureHeight = Math.max(1, maxY - minY);
  let totalWeight = 0;
  let throneWeight = 0;
  const bandSize = iron ? 8 : 2;
  // These ellipses locate the faceplates in the supplied source images.
  const faceplate = seated ? [.569, .415, .08, .065]
    : iron ? [.498, .084, .115, .075] : [.507, .105, .11, .076];
  const [faceX, faceY, faceWidth, faceHeight] = faceplate;
  for (let band = Math.max(1, minY); band <= maxY; band += bandSize) {
    for (let x = Math.max(1, minX); x <= Math.min(width - 2, maxX); x += 2) {
      for (let y = band; y < Math.min(band + bandSize, maxY + 1, height - 1); y += 2) {
        const i = y * width + x;
        if (pixels[i * 4 + 3] < 96) continue;
        const top = i - width, bottom = i + width;
        const dx = luminance[top + 1] + 2 * luminance[i + 1] + luminance[bottom + 1]
          - luminance[top - 1] - 2 * luminance[i - 1] - luminance[bottom - 1];
        const dy = luminance[bottom - 1] + 2 * luminance[bottom] + luminance[bottom + 1]
          - luminance[top - 1] - 2 * luminance[top] - luminance[top + 1];
        const edge = Math.min(1, Math.hypot(dx, dy));
        const light = luminance[i];
        const silhouette = [top, bottom, i - 1, i + 1].some((neighbor) => pixels[neighbor * 4 + 3] < 96);
        const face = fromPhoto ? Math.max(0, Math.min(1, (1 - Math.hypot(
          (x / width - faceX) / faceWidth, (y / height - faceY) / faceHeight,
        )) * 1.8)) : 0;
        const anchor = silhouette ? 1 : Math.max(edge, face);
        let paint: Sample['paint'];
        const furniture = seatedBody !== null && !context.isPointInPath(seatedBody, x, y);
        const helmet = iron && (fromPhoto ? y < 92 : y < 166 && x >= 210 && x <= 330);
        if (fromPhoto || helmet) {
          const offset = i * 4;
          const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
          const lens = helmet && (fromPhoto ? y >= 43 && y <= 58 && Math.min(r, g, b) >= 182 : b - r > 42 && g > 110);
          paint = [r / 255, g / 255, b / 255, lens || furniture ? 2 : 1];
        }
        const density = iron && paint?.[3] === 2 ? 2.5 : 1;
        const weight = (.25 + light * .95 + edge * 1.65) * density * (1 + face * .8);
        if (furniture) throneWeight += weight;
        else totalWeight += weight;
        const sample = {
          x: (x - (minX + maxX) / 2) / figureHeight, y: ((minY + maxY) / 2 - y) / figureHeight,
          light, edge, anchor, face, weight: furniture ? throneWeight : totalWeight, paint,
        };
        (furniture ? throne : samples).push(sample);
        if (!iron && fromPhoto && !furniture) {
          const region = y < (seated ? 263 : 157) ? 0 : y < (seated ? 375 : 425) ? 1 : 2;
          regionWeights[region] += weight;
          regions[region].push({ ...sample, weight: regionWeights[region] });
        }
      }
    }
  }

  const field = { width: (maxX - minX) / figureHeight, samples, throne, regions };
  fields.set(figure, field);
  return field;
}

export function sampleDarkFigure(figure: DarkFigure, count: number, reference: HTMLImageElement | null = null) {
  const { samples, width, throne, regions } = readFigure(figure, reference);
  const positions = new Float32Array(count * 3);
  const details = new Float32Array(count * 3);
  const paint = new Float32Array(count * 4);
  let seed = 4831;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Reserve matching ranges in all three targets. Most points form the
  // character and the rest assemble the chair when the seated stage begins.
  const split = Math.floor(count * .74);
  const writeRange = (source: Sample[], start: number, end: number) => {
    const totalWeight = source.at(-1)?.weight ?? 0;
    let cursor = 0;
    for (let i = start; i < end && totalWeight > 0; i++) {
      const weight = (i - start + random()) / (end - start) * totalWeight;
      while (cursor < source.length - 1 && source[cursor].weight < weight) cursor++;
      const { x, y, light, edge, anchor, face, paint: color } = source[cursor];
      const jitter = color ? .0016 * (1 - anchor * .5) : .003;
      const depthNoise = (random() - .5) * .025;
      // A shallow relief keeps the photographed armor features aligned.
      const depth = color
        ? (light - .35) * .014 + edge * .004 + depthNoise * .35
        : (light - .35) * .085 + edge * .016 + depthNoise;
      positions.set([
        x + (random() - .5) * jitter,
        y + (random() - .5) * jitter,
        depth,
      ], i * 3);
      if (color) paint.set(color, i * 4);
      details.set([Math.min(1, .08 + light * .78 + edge * .32), anchor, face], i * 3);
    }
  };
  if (regions.every(region => region.length > 0)) {
    const headEnd = Math.floor(split * .10);
    const torsoEnd = Math.floor(split * .58);
    writeRange(regions[0], 0, headEnd);
    writeRange(regions[1], headEnd, torsoEnd);
    writeRange(regions[2], torsoEnd, split);
  } else {
    writeRange(samples, 0, split);
  }
  writeRange(throne.length ? throne : samples, split, count);
  return { positions, details, paint, width };
}
