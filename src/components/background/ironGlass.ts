import type { IronImpact } from './ironLaunchParticles';

type Point = { x: number; y: number };
type Line = Point[];

type Shard = {
  corners: Point[];
  origin: Point;
  velocity: [number, number, number];
  spin: [number, number, number];
  tint: number;
};

export const glassRandom = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

const between = (a: Point, b: Point, fraction: number) => ({
  x: a.x + (b.x - a.x) * fraction,
  y: a.y + (b.y - a.y) * fraction,
});

export function fracture(hit: IronImpact, earlier: IronImpact[], aspect: number): Line[] {
  const random = glassRandom(421 + hit.index * 791);
  const lines: Line[] = [];
  const spokes: Line[] = [];
  const count = 9 + hit.index * 2;
  const radius = .139 + hit.index * .062;
  const turn = random() * Math.PI;
  for (let ray = 0; ray < count; ray++) {
    const angle = turn + (ray + random() * .61) * Math.PI * 2 / count;
    const length = radius * (.58 + random() * .82);
    const spoke: Line = [hit];
    for (let step = 1; step <= 6; step++) {
      const distance = length * (step / 6) ** 1.21;
      const heading = angle + (random() - .5) * (.27 + step * .039);
      spoke.push({ x: hit.x + Math.cos(heading) * distance / aspect, y: hit.y + Math.sin(heading) * distance });
      if (step >= 2 && random() > .39) {
        const kink = heading + (random() > .5 ? .52 : -.52);
        const origin = spoke[step];
        const fork = .016 + random() * .061;
        const tip = { x: origin.x + Math.cos(kink) * fork / aspect, y: origin.y + Math.sin(kink) * fork };
        lines.push([origin, between(origin, tip, .44), { x: tip.x + .006 * (random() - .5), y: tip.y }]);
      }
    }
    spokes.push(spoke);
  }
  for (let ray = 0; ray < count; ray++) {
    const next = spokes[(ray + 1) % count];
    for (let ring = 1; ring <= 4; ring++) {
      if (ring > 1 && random() < .23) continue;
      const a = spokes[ray][ring];
      const b = next[ring];
      lines.push([a, between(between(a, b, .51), hit, random() * .32), b]);
    }
  }
  for (const other of earlier) {
    const gap = Math.hypot((other.x - hit.x) * aspect, other.y - hit.y);
    if (gap > radius + .31 && hit.index < 3) continue;
    const zigzag: Line = [hit];
    for (let step = 1; step < 7; step++) {
      const point = between(hit, other, step / 7);
      zigzag.push({ x: point.x + (random() - .5) * .04 / aspect, y: point.y + (random() - .5) * .035 });
    }
    lines.push([...zigzag, other]);
  }
  return [...spokes, ...lines];
}

function divide(polygon: Point[], a: Point, b: Point): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const middle = between(a, b, .5);
  const side = (point: Point) => (point.x - middle.x) * dx + (point.y - middle.y) * dy;
  const result: Point[] = [];
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const distance = side(point);
    const nextDistance = side(next);
    if (distance <= 0) result.push(point);
    if ((distance <= 0) !== (nextDistance <= 0)) result.push(between(point, next, distance / (distance - nextDistance)));
  });
  return result;
}

export function glassShards(width: number, height: number, hits: IronImpact[], final: boolean): Shard[] {
  const hit = hits[hits.length - 1];
  const random = glassRandom(832 + hit.index * 701);
  const impact = { x: hit.x * width, y: hit.y * height };
  const scale = Math.min(width, height);
  const minX = final ? 0 : impact.x - scale * .085;
  const minY = final ? 0 : impact.y - scale * .085;
  const maxX = final ? width : impact.x + scale * .085;
  const maxY = final ? height : impact.y + scale * .085;
  const columns = final ? Math.max(5, Math.min(14, Math.round(width / height * 7))) : 3;
  const rows = final ? 9 : 3;
  const sites = Array.from({ length: columns * rows }, (_, index) => ({
    x: minX + (index % columns + .12 + random() * .76) * (maxX - minX) / columns,
    y: minY + (Math.floor(index / columns) + .12 + random() * .76) * (maxY - minY) / rows,
  }));
  if (final) {
    for (const source of hits) {
      for (let index = 0; index < 5; index++) {
        sites.push({ x: source.x * width + (random() - .5) * scale * .12, y: source.y * height + (random() - .5) * scale * .12 });
      }
    }
  }
  const bounds = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
  return sites.flatMap(site => {
    let cell = bounds;
    for (const neighbor of sites) {
      if (neighbor !== site && cell.length) cell = divide(cell, site, neighbor);
    }
    if (cell.length < 3) return [];
    const origin = {
      x: cell.reduce((sum, p) => sum + p.x, 0) / cell.length,
      y: cell.reduce((sum, p) => sum + p.y, 0) / cell.length,
    };
    const outward = Math.atan2(origin.y - impact.y, origin.x - impact.x);
    const speed = scale * (final ? .16 + random() * .54 : .08 + random() * .15);
    return [{
      corners: cell.map(point => ({ x: point.x - origin.x, y: point.y - origin.y })),
      origin,
      velocity: [Math.cos(outward) * speed, Math.sin(outward) * speed - scale * .12, scale * (-.12 + random() * (final ? 1.12 : .37))],
      spin: [(random() - .5) * 9, (random() - .5) * 10, (random() - .5) * 5],
      tint: random(),
    }];
  });
}

export function drawGlassShards(ctx: CanvasRenderingContext2D, shards: Shard[], width: number, height: number, time: number, final: boolean) {
  const distance = Math.min(width, height) * .89;
  const fade = Math.max(0, 1 - Math.max(0, time - (final ? .75 : .22)) / (final ? 1.55 : .63));
  if (!fade) return;
  const ordered = shards.map(shard => ({ shard, z: shard.velocity[2] * time }));
  ordered.sort((a, b) => a.z - b.z);
  for (const { shard, z } of ordered) {
    if (z > distance * .90) continue;
    const sx = Math.sin(shard.spin[0] * time);
    const cx = Math.cos(shard.spin[0] * time);
    const sy = Math.sin(shard.spin[1] * time);
    const cy = Math.cos(shard.spin[1] * time);
    const sz = Math.sin(shard.spin[2] * time);
    const cz = Math.cos(shard.spin[2] * time);
    const tx = shard.origin.x + shard.velocity[0] * time - width * .5;
    const ty = shard.origin.y + shard.velocity[1] * time + height * .37 * time * time - height * .5;
    const points = shard.corners.map(corner => {
      const px = corner.x * cy + corner.y * sx * sy;
      const py = corner.y * cx;
      const pz = corner.y * sx * cy - corner.x * sy;
      const perspective = distance / Math.max(distance * .085, distance - z - pz);
      return { x: (tx + px * cz - py * sz) * perspective + width * .5, y: (ty + px * sz + py * cz) * perspective + height * .5 };
    });
    const [first, second] = points;
    if ((first.x === second.x && first.y === second.y) || points.every(p => p.x < 0 || p.x > width || p.y < 0 || p.y > height)) continue;
    const reflection = Math.abs(sy * .57 + sx * .43);
    const gradient = ctx.createLinearGradient(first.x, first.y, second.x, second.y);
    gradient.addColorStop(0, `rgba(20, 30, 35, ${fade * .72})`);
    gradient.addColorStop(.39 + shard.tint * .23, `rgba(142, 187, 195, ${fade * (.09 + reflection * .30)})`);
    gradient.addColorStop(1, `rgba(48, 68, 75, ${fade * .47})`);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    if (z > distance * .12) {
      ctx.save();
      ctx.shadowColor = `rgba(149, 216, 222, ${fade * .32})`;
      ctx.shadowBlur = 4 + z / distance * 12;
      ctx.shadowOffsetX = -shard.velocity[0] * .034;
      ctx.shadowOffsetY = -(shard.velocity[1] + height * .74 * time) * .034;
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    ctx.lineWidth = .65 + reflection * .62;
    ctx.strokeStyle = `rgba(198, 228, 228, ${fade * (.27 + reflection * .49)})`;
    ctx.stroke();
  }
}
