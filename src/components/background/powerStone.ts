export function createPowerBeam() {
  const points: number[] = [];
  let seed = 405;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let index = 0; index < 1800; index++) {
    const sheath = index >= 1020;
    const shockwave = index >= 1620;
    const angle = random() * Math.PI * 2;
    const radius = shockwave ? .86 + random() * .14 : sheath ? .32 + random() * .68 : Math.sqrt(random()) * .29;
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius, random() + Number(shockwave));
  }
  return new Float32Array(points);
}

export const powerBeamVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uLane;
  uniform float uIronHeight;
  uniform float uPointSize;
  uniform float uReveal;
  uniform float uPowerCharge;
  uniform float uPowerAge;
  uniform vec4 uProtected[4];
  uniform vec2 uDebrisViewport;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (uPowerCharge < .003 || uPowerAge > 2.05 || uProgress > 1.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 1.0;
      vColor = vec3(0.0);
      vAlpha = 0.0;
      return;
    }

    vec3 origin = vec3(uProtected[1].xy, .031) * uIronHeight;
    origin.x += (uProgress >= 1.0 ? -1.0 : 1.0) * uLane;
    float seed = fract(sin(dot(position, vec3(91.7, 180.2, 49.4))) * 47381.21);
    float charge = smoothstep(0.0, .78, uPowerAge) * uPowerCharge;
    float release = max(0.0, uPowerAge - .78);
    float endDepth = cameraPosition.z - .43;
    vec2 destination = vec2(origin.x > 0.0 ? .30 : -.30, -.19);
    vec3 target = vec3(destination * uDebrisViewport * (1.0 - endDepth / cameraPosition.z), endDepth);
    vec3 direction = normalize(target - origin);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), direction));
    vec3 up = cross(direction, right);
    bool shockwave = position.z >= 1.0;
    float sampleDepth = fract(position.z);
    float distanceAlong = mod(sampleDepth + release * (1.2 + seed * .53), 1.0);
    float head = min(1.0, release * 4.65);
    float radius = length(position.xy);
    float psi = release * (2.8 + seed) - distanceAlong * 14.0;
    vec2 coil = mat2(cos(psi), sin(psi), -sin(psi), cos(psi)) * position.xy;
    float thickness = (.007 + .012 * sin(distanceAlong * 2.4)) * (.87 + .23 * sin(release * 31.0 - distanceAlong * 16.0));
    vec3 beam = mix(origin, target, distanceAlong) + (right * coil.x + up * coil.y) * thickness * uIronHeight;
    float ignition = smoothstep(0.0, .075, release) * (1.0 - smoothstep(.57, .97, release));
    float beamPresence = ignition * step(distanceAlong, head) * uPowerCharge;
    vec2 gather = position.xy * (.112 - .075 * charge) * (.67 + position.z * .33);
    float gatherAngle = uPowerAge * 4.4 + position.z;
    gather = mat2(cos(gatherAngle), sin(gatherAngle), -sin(gatherAngle), cos(gatherAngle)) * gather;
    vec3 accumulation = origin + vec3(gather * vec2(.75, 1.08), (seed - .17) * .052) * uIronHeight;
    bool charging = uPowerAge < .78;
    vec4 view = modelViewMatrix * vec4(charging ? accumulation : beam, 1.0);
    float shock = clamp((release - .23) / .39, 0.0, 1.0);
    if (shockwave) {
      vec3 ripple = target + vec3(position.xy * (.015 + shock * .16) * vec2(1.0, .82), -shock * .16);
      view = modelViewMatrix * vec4(ripple, 1.0);
    }
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(uPointSize * (radius < .30 ? 1.40 : .90) * 8.0 / -view.z, 1.0, shockwave ? 2.7 : 9.0);
    vColor = mix(vec3(.83, .49, 1.0), vec3(.98, .93, 1.0), 1.0 - smoothstep(.04, .55, radius));
    vAlpha = (charging ? charge * (.064 + .086 * seed) : beamPresence * (radius < .30 ? .91 : .25)) * uReveal;
    if (shockwave) {
      vAlpha = step(.23, release) * (1.0 - shock) * .58 * uPowerCharge * uReveal;
      vColor = vec3(.88, .64, 1.0);
    }
  }
`;
