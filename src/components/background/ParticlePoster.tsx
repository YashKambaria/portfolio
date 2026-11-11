import { useMemo } from 'react';
import { createParticleLayouts } from './particleLayouts';
import styles from './ParticleBackground.module.css';

export default function ParticlePoster({ dark = false }: { dark?: boolean }) {
  const points = useMemo(() => createParticleLayouts(920), []);
  // The non-WebGL and reduced-motion experience intentionally shows the first
  // semantic target: the laptop. Theme changes its ink treatment, not geometry.
  const layout = points[0];
  const dots = useMemo(() => {
    const result: Array<{ x: number; y: number; radius: number; opacity: number; key: number }> = [];
    const stride = 1;
    for (let index = 0; index < layout.length / 3; index += stride) {
      const x = layout[index * 3];
      const y = layout[index * 3 + 1];
      const z = layout[index * 3 + 2];
      result.push({
        x: 492 + x * 84,
        y: 226 - y * 118,
        radius: 0.55 + Math.min(1.15, (z + 0.6) * 0.42),
        opacity: dark ? 0.46 + Math.min(0.4, Math.max(0, z) * 0.28) : 0.24 + Math.min(0.28, Math.max(0, z) * 0.2),
        key: index,
      });
    }
    return result;
  }, [dark, layout]);

  return <svg className={styles.poster} viewBox="0 0 680 460" role="presentation" focusable="false">
    <g fill={dark ? '#E3E9E9' : '#17232D'}>
      {dots.map((dot) => <circle key={dot.key} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} />)}
    </g>
  </svg>;
}
