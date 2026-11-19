// All points in a fragment share its launch phase and original position.
// Sampling the rough shell keeps the stones recognizable as they approach.
export function createDoomDebris() {
  const positions: number[] = [];
  const fragments: number[] = [];
  const shades: number[] = [];
  let seed = 7409;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const count = 12;
  for (let fragment = 0; fragment < count; fragment++) {
    // Interleave the left reading area and the character's side of the screen.
    const lane = fragment % 2 === 0 ? fragment / 2 : count / 2 + (fragment - 1) / 2;
    const x = -.46 + (lane + .2 + random() * .6) * .92 / count;
    const y = -.28 + random() * .62;
    const phase = (fragment + random() * .5) / count;
    const size = .034 + random() * .024 + (fragment % 5 === 0 ? .017 : 0);
    const drift = random() - .5;
    for (let i = 0; i < 156; i++) {
      const azimuth = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const rim = Math.sqrt(1 - z * z);
      const shell = size * (.84 + .19 * Math.cos(azimuth * 5 + z * 3) + .09 * random());
      positions.push(Math.cos(azimuth) * rim * shell, Math.sin(azimuth) * rim * shell * .78, z * shell * .87);
      fragments.push(x, y, phase, drift);
      shades.push(.48 + z * .20 + random() * .28);
    }
  }
  return { points: new Float32Array(positions), fragments: new Float32Array(fragments), shades: new Float32Array(shades) };
}

export const debrisVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uSit;
  uniform float uDoomHeight;
  uniform vec2 uDebrisViewport;
  uniform float uPointSize;
  uniform float uReveal;
  uniform float uDebrisTime;
  uniform float uDebrisPower;
  attribute vec4 aFragment;
  attribute float aShade;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float age = uDebrisTime - aFragment.z * 1.82;
    float life = fract(max(0.0, age) / 2.65);
    // Hold the stones at background depth until they rise off the ground.
    // Then accelerate on the camera axis so the same points grow in perspective.
    float rise = smoothstep(0.0, .43, life);
    float shot = pow(clamp((life - .43) / .57, 0.0, 1.0), 2.35);
    float angle = aFragment.z * 11.0 + life * 7.0;
    vec3 rock = position;
    rock.xz = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * rock.xz;
    rock.xy = mat2(cos(angle * .62), sin(angle * .62), -sin(angle * .62), cos(angle * .62)) * rock.xy;
    float breakup = smoothstep(.27, 1.0, shot);
    rock += vec3(sin(aShade * 28.0), cos(aShade * 37.0), sin(aShade * 51.0)) * breakup * .018;
    vec2 ground = vec2(aFragment.x + aFragment.w * rise * .065, mix(-.64, aFragment.y, rise));
    vec2 shotDirection = vec2(aFragment.w * .23, aFragment.y * .18 + .038);
    float depth = mix(-1.85, cameraPosition.z - .67, shot);
    float perspective = 1.0 - depth / cameraPosition.z;
    vec3 world = vec3((ground * perspective + shotDirection * shot) * uDebrisViewport, depth);
    world += rock * uDoomHeight;
    vec4 view = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(uPointSize * (.64 + aShade * .60) * 8.0 / -view.z, 1.05, uPointSize * 3.25);

    vColor = mix(vec3(.38, .44, .40), vec3(.88, .94, .90), aShade);
    float liftFlash = sin(rise * 3.14159265);
    float magicTint = (.16 + .35 * liftFlash + .12 * shot) * smoothstep(.40, .80, aShade);
    vColor = mix(vColor, vec3(.38, 1.0, .58), magicTint);
    float flight = smoothstep(.035, .19, life) * (1.0 - smoothstep(.908, .995, life));
    float behindCopy = mix(.91, 1.0, smoothstep(.0, .19, aFragment.x));
    vAlpha = step(2.0, uProgress) * (1.0 - smoothstep(0.0, .14, uSit)) * step(0.0, age)
      * uReveal * uDebrisPower * (.65 + .35 * aShade) * flight * behindCopy;

  }
`;
