export const ironLaunchEvent = 'portfolio:iron-launch';
export const ironImpactEvent = 'portfolio:iron-impact';
export const ironResetEvent = 'portfolio:iron-reset';

// Display coordinates within the particle canvas, with launch and impact times in seconds.
export const ironShots = [
  { x: .70, y: .33, start: .43, hit: 1.24 },
  { x: .24, y: .59, start: 1.20, hit: 2.04 },
  { x: .89, y: .67, start: 2.00, hit: 2.80 },
  { x: .37, y: .21, start: 2.78, hit: 3.64 },
  { x: .53, y: .47, start: 3.95, hit: 5.16 },
] as const;

export type IronLaunch = { side: number; flightSeconds: number };
export type IronImpact = { x: number; y: number; final: boolean; index: number };

export function createIronLaunchParticles() {
  const positions: number[] = [];
  const parts: number[] = [];
  let seed = 8570;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (const side of [-1, 1]) {
    for (let index = 0; index < 170; index++) {
      const edge = index % 4;
      const along = random() - .5;
      const x = index < 92 ? (edge < 2 ? along : edge - 2.5) : random() - .5;
      const y = index < 92 ? (edge < 2 ? edge - .5 : along) : random() - .5;
      positions.push(x * .058, y * .099, (random() - .5) * .009);
      parts.push(side, 0, 0, random());
    }
  }

  ironShots.forEach((_, shot) => {
    const side = shot % 2 === 0 ? 1 : -1;
    for (let index = 0; index < 550; index++) {
      let angle = random() * Math.PI * 2;
      let length = random();
      const shade = random();
      const type = index < 320 ? 1 : index < 431 ? 2 : index < 500 ? 3 : 4;
      let axial = length;
      let radius: number;
      if (type === 1) {
        if (index >= 80) {
          const ring = Math.floor((index - 80) / 16);
          length = Math.min(1, (ring + shade * .9) / 14.65);
          angle = ((index - 80) % 16 + (ring % 2) * .5 + (random() - .5) * .59) * Math.PI / 8;
        }
        axial = -.057 + length * .124;
        const ogive = Math.max(0, (length - .58) / .42);
        radius = .0087 * (1 - ogive ** 1.42);
        if (index < 48) {
          // Four small fins taper into the hull toward the front.
          angle = (index % 4) * Math.PI / 2 + (shade - .5) * .065;
          axial = -.055 + length * .033;
          radius = .0082 + .009 * (1 - length) * (.22 + .78 * random());
        } else if (index < 80) {
          axial = -.057 + length * .004;
          radius = .007 + random() * .0037;
        }
      } else if (type === 2) {
        radius = .011 * (1 - length * .79) * Math.sqrt(random());
      } else {
        radius = (type === 3 ? .013 : .035) * Math.sqrt(random());
      }
      positions.push(Math.cos(angle) * radius, axial, Math.sin(angle) * radius);
      parts.push(side, type, shot, shade);
    }
  });

  return { points: new Float32Array(positions), parts: new Float32Array(parts) };
}

const paths = ironShots.map(({ x, y, start, hit }, index) => `
    if (shot == ${index}) {
      target = vec2(${x.toFixed(4)} - .5, .5 - ${y.toFixed(4)});
      launch = ${start.toFixed(4)};
      impact = ${hit.toFixed(4)};
    }`).join('');

export const ironLaunchVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uIronHeight;
  uniform float uLane;
  uniform float uStageY;
  uniform float uPointSize;
  uniform float uIronLaunchTime;
  uniform float uIronLaunchPower;
  uniform float uIronLaunchSide;
  uniform vec2 uDebrisViewport;
  uniform float uReveal;
  attribute vec4 aLaunchPart;
  varying vec3 vColor;
  varying float vAlpha;

  float travel(float life) {
    return life * (.27 + .73 * life);
  }

  void main() {
    if (uIronLaunchTime >= ${ironShots.at(-1)!.hit.toFixed(3)} || max(uIronLaunchPower, uIronLaunchTime) < .006) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 1.0;
      vColor = vec3(0.0);
      vAlpha = 0.0;
      return;
    }

    float side = aLaunchPart.x;
    float type = aLaunchPart.y;
    float shade = aLaunchPart.w;
    float opened = smoothstep(0.0, .85, uIronLaunchPower);
    float lane = uLane * uIronLaunchSide;
    vec3 point = position;
    float presence = 0.0;

    if (type == 0.0) {
      float hinge = side * opened * .96;
      point.xz = mat2(cos(hinge), sin(hinge), -sin(hinge), cos(hinge)) * point.xz;
      point.yz = mat2(cos(opened * .38), sin(opened * .38), -sin(opened * .38), cos(opened * .38)) * point.yz;
      point = (point + vec3(side * (.132 + .057 * opened), .285 + .030 * opened, -.10)) * uIronHeight;
      point.x += lane;
      point.y += uStageY;
      vColor = mix(vec3(.28, .10, .10), vec3(.71, .61, .49), shade);
      presence = opened * .84 * (1.0 - step(1.001, uProgress));
    } else {
      int shot = int(aLaunchPart.z);
      vec2 target = vec2(0.0);
      float launch = 0.0;
      float impact = 1.0;
      ${paths}
      float age = uIronLaunchTime - launch;
      const float readyTime = .19;
      if (age < -readyTime || uIronLaunchTime >= impact || (age < 0.0 && type != 1.0 && type != 4.0)) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 1.0;
        vColor = vec3(0.0);
        vAlpha = 0.0;
        return;
      }

      float duration = impact - launch;
      float life = clamp(age / duration, 0.0, 1.0);
      float deploy = smoothstep(-readyTime, 0.0, age);
      float depth = cameraPosition.z - 1.12;
      vec3 start = vec3(lane + side * .185 * uIronHeight, .305 * uIronHeight + uStageY, -.17 * uIronHeight);
      vec3 impactPoint = vec3(target * uDebrisViewport * (1.0 - depth / cameraPosition.z), depth);
      vec3 direction = normalize(impactPoint - start);
      vec3 end = impactPoint - direction * .067 * uIronHeight;
      vec3 rail = normalize(vec3(side * .27, .84, .47));
      vec3 nose = normalize(mix(rail, direction, deploy));
      vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), nose));
      vec3 up = cross(nose, right);
      float roll = life * 2.1 + side * .42;
      vec2 shell = mat2(cos(roll), sin(roll), -sin(roll), cos(roll)) * position.xz;
      float delay = type == 3.0 ? .08 + position.y * .29 : 0.0;
      float traceLife = clamp((age - delay) / duration, 0.0, 1.0);
      vec3 stowed = start - rail * (1.0 - deploy) * .055 * uIronHeight;
      vec3 center = mix(stowed, end, travel(traceLife));
      float width = type == 3.0 ? .56 + position.y * 2.3 : 1.0;
      point = center + (right * shell.x + up * shell.y) * uIronHeight * width;

      float lit;
      if (type == 1.0) {
        point += nose * position.y * uIronHeight;
        vec3 surface = normalize(right * shell.x + up * shell.y + nose * max(0.0, position.y - .025) * .30);
        float metal = .32 + .64 * max(0.0, dot(surface, normalize(vec3(-.45, .80, .76))));
        vec3 steel = mix(vec3(.12, .15, .18), vec3(.97, .98, 1.0), metal * (.88 + shade * .12));
        float band = step(.002, position.y) * (1.0 - step(.014, position.y));
        float throat = 1.0 - step(-.043, position.y);
        vColor = mix(steel, mix(vec3(.30, .13, .048), vec3(1.0, .68, .28), metal), band);
        vColor *= 1.0 - throat * .27;
        lit = smoothstep(-readyTime, -.10, age) * .96;
      } else if (type == 2.0) {
        float flame = .86 + .14 * sin(age * 80.0 + shade * 33.0);
        point -= nose * (.058 + position.y * (.080 + .043 * life) * flame) * uIronHeight;
        vColor = mix(vec3(1.0, .23, .035), vec3(1.0, .96, .77), pow(1.0 - position.y, 1.65));
        lit = smoothstep(0.0, .019, age) * flame * (1.0 - position.y * .58);
      } else if (type == 3.0) {
        point -= nose * .10 * uIronHeight;
        vColor = mix(vec3(.31, .29, .26), vec3(.65, .63, .58), shade);
        lit = smoothstep(delay, delay + .037, age) * (.18 + .20 * shade) * (1.0 - position.y * .70);
      } else {
        // A small ignition flash stays at the shoulder as the missile moves away.
        float spark = smoothstep(-.038, .016, age) * (1.0 - smoothstep(.031, .18, age));
        float expansion = .45 + clamp(age / .18, 0.0, 1.0) * 1.4;
        point = start + ((right * shell.x + up * shell.y) * expansion - nose * (.04 + position.y * .064)) * uIronHeight;
        vColor = mix(vec3(1.0, .30, .07), vec3(1.0, .91, .69), shade);
        lit = spark * (.43 + .53 * shade);
      }
      presence = lit;
    }

    vec4 view = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * view;
    float pixelSize = type == 1.0 ? 1.13 + shade * .24 : type == 2.0 ? 1.19 + shade * .55 : .58 + shade * .59;
    gl_PointSize = clamp(uPointSize * pixelSize * 8.0 / -view.z, 1.0, uPointSize * (type == 3.0 ? 3.6 : 2.65));
    vAlpha = presence * uReveal;
  }
`;
