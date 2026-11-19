import { useLayoutEffect, useRef } from 'react';
import styles from './DarkAtmosphere.module.css';

const finePointer = '(hover: hover) and (pointer: fine)';

function progressAt(gap: Element | null, readingLine: number) {
  if (!gap) return 0;
  const bounds = gap.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (readingLine - bounds.top) / Math.max(1, bounds.height)));
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

export default function DarkAtmosphere({ reducedMotion }: { reducedMotion: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const layer = root.current;
    if (!layer) return;

    const [atlasGap, projectsGap, throneGap] = ['hero-atlas', 'atlas-projects', 'capabilities-practice']
      .map((name) => document.querySelector(`[data-particle-transition="${name}"]`));
    const pointer = window.matchMedia(finePointer);
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      frame = 0;
      const readingLine = window.innerHeight * .46;
      const atlas = progressAt(atlasGap, readingLine);
      const doom = progressAt(projectsGap, readingLine);
      const throne = progressAt(throneGap, readingLine);
      layer.style.setProperty('--atmosphere-iron', String(1 - doom));
      layer.style.setProperty('--atmosphere-doom', String(doom));
      layer.style.setProperty('--atmosphere-travel', String(atlas));
      layer.style.setProperty('--atmosphere-throne', String(throne));
      layer.style.setProperty('--atmosphere-x', `${pointerX}px`);
      layer.style.setProperty('--atmosphere-y', `${pointerY}px`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const followPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !pointer.matches) return;
      pointerX = (event.clientX / window.innerWidth - .5) * 28;
      pointerY = (event.clientY / window.innerHeight - .5) * 20;
      schedule();
    };

    const resetPointer = () => {
      pointerX = 0;
      pointerY = 0;
      schedule();
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if (!reducedMotion) {
      window.addEventListener('pointermove', followPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', resetPointer);
      pointer.addEventListener('change', resetPointer);
    }
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', followPointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      pointer.removeEventListener('change', resetPointer);
    };
  }, [reducedMotion]);

  return <div ref={root} className={styles.atmosphere}>
    <div className={styles.iron}>
      <svg className={styles.reactor} viewBox="0 0 640 640" fill="none" aria-hidden="true" focusable="false">
        <g className={styles.reactorEtching} stroke="currentColor">
          <circle cx="320" cy="320" r="298" strokeDasharray="1 9" />
          <circle cx="320" cy="320" r="270" strokeDasharray="150 31 40 76" />
          <circle cx="320" cy="320" r="242" />
          <circle cx="320" cy="320" r="172" strokeDasharray="3 7" />
          <path d="M22 320h55m486 0h55M320 22v55m0 486v55M89 163h42l36 36m306 242 36 36h42M89 477h42l36-36m306-242 36-36h42" />
        </g>
        <g className={styles.reactorSignal} stroke="currentColor" strokeWidth="2">
          <path d="M110 201a242 242 0 0 1 154-117m112 472a242 242 0 0 0 154-117M136 404a202 202 0 0 1 0-168m368 0a202 202 0 0 1 0 168" />
          <path d="M320 102v16m0 404v16M102 320h16m404 0h16" />
        </g>
      </svg>
    </div>
    <div className={styles.doom}>
      <svg className={styles.arch} viewBox="0 0 720 800" fill="none" aria-hidden="true" focusable="false">
        <g className={styles.archEtching} stroke="currentColor">
          <path d="M28 790V343C28 162 146 108 360 37c214 71 332 125 332 306v447M62 790V343C62 178 171 129 360 64c189 65 298 114 298 279v447" />
          <path d="M14 790V352m692 438V352M86 790V387m548 403V387M14 722h92m508 0h92M14 760h92m508 0h92" />
          <path d="M28 446h58m548 0h58M28 526h58m548 0h58M28 606h58m548 0h58M28 686h58m548 0h58" strokeDasharray="3 8" />
        </g>
        <g className={styles.archSignal} stroke="currentColor" strokeWidth="2">
          <path d="M268 69c29-11 60-22 92-32 32 10 63 21 92 32M28 618v96m664-96v96" />
          <path d="m62 472 9 14-9 14-9-14 9-14Zm596 0 9 14-9 14-9-14 9-14Z" />
        </g>
      </svg>
    </div>
  </div>;
}
