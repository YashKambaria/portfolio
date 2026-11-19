export const particleMotion = /* glsl */ `
vec4 particleMotion(vec2 anchor, float seed, float time) {
  // Mix a broad traveling current with a small, independent orbit per point.
  // Every orbit stays centered on its sampled position, so drift never accumulates.
  float band = dot(anchor, vec2(1.85, -2.35));
  float flow = sin(band - time * 1.55);
  float crossFlow = sin(dot(anchor, vec2(3.2, 3.65)) + time * 1.27);
  float orbit = time * (1.45 + fract(seed * 23.17) * .85) + seed * 6.2831853;
  vec3 drift = vec3(
    .64 * sin(orbit) + .36 * flow,
    .68 * cos(orbit + band * .5) + .32 * crossFlow,
    .65 * sin(orbit * .78 + band) + .35 * flow
  );
  return vec4(drift, .55 * flow + .45 * sin(orbit + band));
}
`;
