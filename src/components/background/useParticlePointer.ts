import { useEffect, useRef } from 'react';
import { Vector2 } from 'three';

export function useParticlePointer(canvas: HTMLCanvasElement, enabled = true, maxSpeed = 2100) {
  const pointer = useRef({ x: 0, y: 0, active: false, touch: false, held: false, time: 0, velocity: new Vector2() });

  useEffect(() => {
    if (!enabled) return;
    let touchId: number | undefined;
    let release = 0;
    const clear = () => {
      window.clearTimeout(release);
      touchId = undefined;
      const sample = pointer.current;
      sample.active = false;
      sample.held = false;
      sample.time = 0;
      sample.velocity.set(0, 0);
    };
    const isStage = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('[data-particle-stage]'));
    const update = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = bounds.bottom - event.clientY;
      const sample = pointer.current;
      if (sample.time) {
        const elapsed = Math.min(.08, Math.max(.008, (event.timeStamp - sample.time) / 1000));
        sample.velocity.set((x - sample.x) / elapsed, (y - sample.y) / elapsed).clampLength(0, maxSpeed);
      }
      sample.x = x;
      sample.y = y;
      sample.time = event.timeStamp;
      sample.active = x >= 0 && x < bounds.width && y >= 0 && y < bounds.height;
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !event.isPrimary) return;
      clear();
      pointer.current.touch = true;
      if (!isStage(event.target)) return;
      touchId = event.pointerId;
      pointer.current.held = true;
      update(event);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        if (event.pointerId === touchId) update(event);
        return;
      }
      if (event.pointerType !== 'mouse' && !(event.pointerType === 'pen' && event.buttons === 0)) return;
      if (pointer.current.touch) clear();
      pointer.current.touch = false;
      update(event);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== touchId) return;
      touchId = undefined;
      pointer.current.held = false;
      release = window.setTimeout(clear, 1050);
    };
    const cancel = (event: PointerEvent) => {
      if (event.pointerId === touchId) clear();
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') clear();
    };
    const scroll = () => {
      if (pointer.current.touch) clear();
    };
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('blur', clear);
    document.documentElement.addEventListener('pointerleave', leave);

    return () => {
      clear();
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('blur', clear);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [canvas, enabled, maxSpeed]);

  return pointer;
}
