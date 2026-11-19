import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fracture, glassShards, drawGlassShards } from './ironGlass';
import { ironImpactEvent, ironLaunchEvent, ironResetEvent, type IronImpact, type IronLaunch } from './ironLaunchParticles';
import styles from './DarkCinematics.module.css';
import { DarkCinematicAudio } from './darkCinematicAudio';

type Impact = IronImpact & { time: number };

export default function IronScreenEffects() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (broken) resetButton.current?.focus({ preventScroll: true });
  }, [broken]);

  useEffect(() => {
    const surface = canvas.current;
    const ctx = surface?.getContext('2d');
    const site = document.querySelector<HTMLElement>('.site-frame');
    if (!surface || !ctx || !site) return;
    const view = surface;
    const pen = ctx;
    const page = site;
    const main = document.getElementById('main-content');
    const audio = typeof AudioContext === 'undefined' ? undefined : new DarkCinematicAudio();
    const activationEvents = ['pointerdown', 'pointerup', 'keydown'] as const;
    const activateAudio = (event: Event) => {
      if (event.isTrusted) audio?.resume();
    };
    if (navigator.userActivation?.hasBeenActive) audio?.resume();

    const syncDoomAudio = () => {
      if (page.hasAttribute('data-doom-arrived')) audio?.arriveAtDoom();
      else audio?.leaveDoom();
    };
    let hits: Impact[] = [];
    let cracks: ReturnType<typeof fracture>[] = [];
    let shards: ReturnType<typeof glassShards> = [];
    let focus: HTMLElement | null = null;
    let cameraShake: Animation | undefined;
    let previousInert = false;
    let raf = 0;
    let width = 0;
    let height = 0;

    const draw = (now: number) => {
      raf = 0;
      pen.clearRect(0, 0, width, height);
      const newest = hits.at(-1);
      if (!newest) return;
      const age = (now - newest.time) / 1000;

      if (!newest.final) {
        if (hits.length >= 3) {
          const instability = Math.max(0, 1 - age / .33) * .10;
          pen.fillStyle = `rgba(8, 12, 15, ${instability})`;
          pen.fillRect(0, 0, width, height);
        }

        cracks.forEach((group, index) => {
          const spread = Math.min(1, Math.max(.20, (now - hits[index].time) / 195));
          const reflection = Math.max(0, 1 - age / .42) * .14;
          pen.beginPath();
          for (const line of group) {
            const origin = line[0];
            pen.moveTo(origin.x * width, origin.y * height);
            for (const point of line.slice(1)) {
              pen.lineTo((origin.x + (point.x - origin.x) * spread) * width, (origin.y + (point.y - origin.y) * spread) * height);
            }
          }
          pen.lineWidth = 2.2;
          pen.strokeStyle = 'rgba(5, 11, 14, .68)';
          pen.stroke();
          pen.lineWidth = .72 + index * .11;
          pen.strokeStyle = `rgba(199, 231, 230, ${.42 + reflection + index * .045})`;
          pen.stroke();
          const x = hits[index].x * width;
          const y = hits[index].y * height;
          pen.fillStyle = 'rgba(208, 237, 232, .64)';
          pen.beginPath();
          pen.arc(x, y, 1.15 + index * .35, 0, Math.PI * 2);
          pen.fill();
        });
      }

      if (shards.length) drawGlassShards(pen, shards, width, height, age, newest.final);
      const pulse = Math.max(0, 1 - age / (newest.final ? .38 : .24));
      if (pulse) {
        const x = newest.x * width;
        const y = newest.y * height;
        const scale = Math.min(width, height);
        const radius = scale * (newest.final ? .42 : .14) * (.07 + (1 - pulse) * .93);
        const core = Math.max(10, radius * .83);
        const flash = pen.createRadialGradient(x, y, 0, x, y, core);
        flash.addColorStop(0, `rgba(255, 243, 211, ${pulse * .88})`);
        flash.addColorStop(.20, `rgba(236, 196, 144, ${pulse * .51})`);
        flash.addColorStop(.61, `rgba(145, 193, 205, ${pulse * .17})`);
        flash.addColorStop(1, 'transparent');
        pen.fillStyle = flash;
        pen.fillRect(x - core, y - core, core * 2, core * 2);
        pen.beginPath();
        pen.ellipse(x, y, radius, radius * .91, -.13, 0, Math.PI * 2);
        pen.lineWidth = 1 + pulse * 2;
        pen.strokeStyle = `rgba(229, 230, 214, ${pulse * .44})`;
        pen.stroke();
      }
      if (age < (newest.final ? 2.35 : shards.length ? .87 : .45)) raf = requestAnimationFrame(draw);
    };

    const redraw = () => {
      cancelAnimationFrame(raf);
      draw(performance.now());
    };

    const resize = () => {
      width = view.clientWidth;
      height = view.clientHeight;
      const ratio = Math.min(devicePixelRatio, 1.6);
      view.width = Math.max(1, Math.round(width * ratio));
      view.height = Math.max(1, Math.round(height * ratio));
      pen.setTransform(ratio, 0, 0, ratio, 0, 0);
      cracks = hits.map((hit, index) => fracture(hit, hits.slice(0, index), width / Math.max(1, height)));
      const newest = hits.at(-1);
      if (newest && shards.length) shards = glassShards(width, height, hits, newest.final);
      redraw();
    };

    const unlock = () => {
      if (!hits.at(-1)?.final) return;
      page.inert = previousInert;
      focus?.focus({ preventScroll: true });
      focus = null;
    };

    const reset = () => {
      audio?.stopIron();
      unlock();
      cameraShake?.cancel();
      hits = [];
      cracks = [];
      shards = [];
      setBroken(false);
      redraw();
    };

    const onLaunch = (event: Event) => {
      const { side, flightSeconds } = (event as CustomEvent<IronLaunch>).detail;
      audio?.launch(side, flightSeconds);
    };

    const onImpact = (event: Event) => {
      const hit = (event as CustomEvent<IronImpact>).detail;
      if (!hit || hit.index !== hits.length) return;
      audio?.impact(hit.index, hit.x, hit.final);
      cracks.push(fracture(hit, hits, width / Math.max(1, height)));
      hits.push({ ...hit, time: performance.now() });
      if (hit.index >= 2) shards = glassShards(width, height, hits, hit.final);
      cameraShake?.cancel();
      const force = 2 + hit.index;
      const skew = hit.index < 2 ? 0 : force * .11;
      cameraShake = main?.animate([
        { transform: `translate(${force}px, ${-force * .6}px) skewX(${skew}deg)` },
        { transform: `translate(${-force * .6}px, ${force * .4}px) skewX(${-skew * .7}deg)` },
        { transform: 'translate(0, 0)' },
      ], { duration: 155 + hit.index * 24, easing: 'ease-out' });
      if (hit.final) {
        focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        previousInert = page.inert;
        page.inert = true;
        setBroken(true);
      }
      redraw();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (hits.length || page.hasAttribute('data-iron-sequence'))) requestRestore();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey);
    const doomObserver = new MutationObserver(syncDoomAudio);
    doomObserver.observe(page, { attributes: true, attributeFilter: ['data-doom-arrived'] });
    syncDoomAudio();
    for (const type of activationEvents) window.addEventListener(type, activateAudio, true);
    window.addEventListener(ironLaunchEvent, onLaunch);
    window.addEventListener(ironImpactEvent, onImpact);
    window.addEventListener(ironResetEvent, reset);
    return () => {
      unlock();
      cancelAnimationFrame(raf);
      cameraShake?.cancel();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      doomObserver.disconnect();
      for (const type of activationEvents) window.removeEventListener(type, activateAudio, true);
      window.removeEventListener(ironLaunchEvent, onLaunch);
      window.removeEventListener(ironImpactEvent, onImpact);
      window.removeEventListener(ironResetEvent, reset);
      if (page.hasAttribute('data-iron-sequence')) requestRestore();
      audio?.dispose();
    };
  }, []);

  return createPortal(
    <div className={styles.glassOverlay} data-broken={broken || undefined}>
      <canvas ref={canvas} aria-hidden="true" />
      {broken && <button ref={resetButton} type="button" className={styles.restore} onClick={requestRestore}>Restore portfolio</button>}
    </div>,
    document.body,
  );
}

function requestRestore() {
  window.dispatchEvent(new Event(ironResetEvent));
}
