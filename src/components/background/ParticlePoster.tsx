import { useMemo } from 'react';
import { createLaptopLayout } from './particleLayouts';
import styles from './ParticleBackground.module.css';

export default function ParticlePoster() {
  const dots = useMemo(() => {
    const layout = createLaptopLayout(920);
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
        opacity: 0.24 + Math.min(0.28, Math.max(0, z) * 0.2),
        key: index,
      });
    }
    return result;
  }, []);

  return <svg className={styles.poster} viewBox="0 0 680 460" role="presentation" focusable="false">
    <g fill="var(--particle-primary)">
      {dots.map((dot) => <circle key={dot.key} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} />)}
    </g>
  </svg>;
}
