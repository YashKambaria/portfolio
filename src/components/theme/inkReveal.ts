type Point = { x: number; y: number };

const turn = 2 * Math.PI;
const edgePoints = 320;
const frameCount = 38;
const duration = 2200;

const coordinates = ({ x, y }: Point) => `${Math.round(x)} ${Math.round(y)}`;
const midpoint = (a: Point, b: Point) => coordinates({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function droplet(center: Point, width: number, height: number, angle: number, bend: number) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const point = (x: number, y: number) => coordinates({
    x: center.x + x * width * cos - y * height * sin,
    y: center.y + x * width * sin + y * height * cos,
  });

  // Unequal handles leave a round head and a curved, tapered tail.
  return [
    `M${point(1, bend)} C${point(.46, .77)} ${point(.10, 1.16)} ${point(-.44, .88)}`,
    `C${point(-.87, .70)} ${point(-1, .28)} ${point(-1, -.06)}`,
    `C${point(-.87, -.61)} ${point(-.55, -1.18)} ${point(-.12, -.86)}`,
    `C${point(.41, -.53)} ${point(.63, bend - .31)} ${point(1, bend)}Z`,
  ].join(' ');
}

function stamp(origin: Point, radius: number, heading: number, time: number) {
  const polar = (angle: number, offset: number) => {
    const direction = angle - heading;
    const surge = Math.sin(13 * angle - time * 3 + .8 * Math.sin(5 * angle));
    const grain = Math.sin(31 * angle + time * 4.7 + .7 * Math.cos(9 * angle));
    const curl = Math.sin(67 * angle - time * 5);
    const seep = Math.sin(103 * angle + time * 5 + Math.cos(17 * angle)) ** 3;
    const reach = 1 + .17 * Math.cos(direction) + .061 * Math.sin(5 * angle + time)
      + .071 * surge ** 3 + .031 * grain + .019 * curl + .008 * seep;
    const flow = angle + .032 * Math.sin(9 * angle + time * 2) + .012 * Math.cos(19 * angle - time * 3);
    const distance = Math.max(0, radius * (reach + offset));
    return { x: origin.x + Math.cos(flow) * distance, y: origin.y + Math.sin(flow) * distance };
  };

  const outline = Array.from({ length: edgePoints }, (_, index) => polar(index / edgePoints * turn, 0));
  const contour = [
    `M${midpoint(outline[edgePoints - 1], outline[0])}`,
    ...outline.map((point, index) => `Q${coordinates(point)} ${midpoint(point, outline[(index + 1) % edgePoints])}`),
    'Z',
  ].join(' ');

  const spread = Math.min(1, time * 7, (1 - time) * 11);
  const count = 64;
  const drops = Array.from({ length: count }, (_, index) => {
    const angle = index / count * turn + Math.sin(index * 4.27) * .071;
    const hole = index % 3 === 0;
    const pulse = (.59 + .41 * Math.sin(index * 2.2 - time * 7) ** 2) * spread;
    const size = .14 + .86 * Math.sin(index * 3.8 + .9) ** 4;
    const center = polar(angle, (hole ? -.047 : .027 + size * .025) * spread);
    const width = radius * (hole ? .064 : .037) * pulse * size;
    const height = radius * (.004 + .011 * size) * pulse;
    return droplet(center, width, height, angle + Math.sin(index * 4) * .85, Math.sin(index * 6) * .65);
  });

  return `path(evenodd, "${contour} ${drops.join(' ')}")`;
}

export function animateInkReveal(root: HTMLElement, origin: Point) {
  const width = root.clientWidth;
  const height = root.clientHeight;
  const distances = [Math.hypot(origin.x, origin.y), Math.hypot(width - origin.x, origin.y),
    Math.hypot(origin.x, height - origin.y), Math.hypot(width - origin.x, height - origin.y)];
  const radius = Math.max(...distances) * 1.13 + 12;
  const heading = Math.atan2(height / 2 - origin.y, width / 2 - origin.x);
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const time = index / (frameCount - 1);
    // A quick bloom feeds the advancing edge, then the final wisps ease into place.
    const growth = .125 * (1 - (1 - time) ** 7) + .875 * (time * time * (3 - 2 * time)) ** 1.14;
    const overshoot = .46 * (Math.max(0, time - .86) / .14) ** 2;
    return { clipPath: stamp(origin, radius * (growth + overshoot), heading, time) };
  });
  return root.animate(frames, { duration, fill: 'both', pseudoElement: '::view-transition-new(root)' });
}
