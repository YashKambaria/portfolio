import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { glassRandom } from './ironGlass';
import styles from './DarkCinematics.module.css';

type GlyphParticle = { x: number; y: number; seed: number; pigment: number };
type Point = { x: number; y: number };

function visibleHeading() {
  const compact = window.matchMedia('(max-width: 1023px)').matches;
  const candidates = [...document.querySelectorAll<HTMLElement>(compact
    ? '#hero-title, #systems-atlas h3, [data-mobile-stone-copy]'
    : '#hero-title, #systems-atlas h3')];
  return candidates.map(element => {
    const { top, bottom } = element.getBoundingClientRect();
    return { element, visible: Math.min(innerHeight, bottom) - Math.max(70, top) };
  }).filter(item => item.visible > 0).sort((a, b) => b.visible - a.visible)[0]?.element;
}

function sampleGlyphs(heading: HTMLElement): GlyphParticle[] {
  const text = heading.firstChild;
  if (!(text instanceof Text)) return [];
  const bounds = heading.getBoundingClientRect();
  const font = getComputedStyle(heading);
  const mask = document.createElement('canvas');
  const padding = 10;
  mask.width = Math.ceil(bounds.width + padding * 2);
  mask.height = Math.ceil(bounds.height + padding * 2);
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText('Ag');
  const range = document.createRange();
  for (let index = 0; index < text.length; index++) {
    range.setStart(text, index);
    range.setEnd(text, index + 1);
    const glyph = range.getBoundingClientRect();
    const baseline = glyph.top - bounds.top + padding
      + (glyph.height + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) * .5;
    ctx.fillText(text.data[index], glyph.left - bounds.left + padding, baseline);
  }
  const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
  const density = Math.max(2, Math.ceil(Math.sqrt(mask.width * mask.height / 52000)));
  const random = glassRandom(761);
  const dots: GlyphParticle[] = [];
  for (let y = 0; y < mask.height; y += density) {
    for (let x = 0; x < mask.width; x += density) {
      if (pixels[(y * mask.width + x) * 4 + 3] < 112) continue;
      dots.push({ x: x - padding + (random() - .5) * 1.05, y: y - padding + (random() - .5) * 1.05, seed: random(), pigment: random() });
    }
  }
  return dots;
}

function realitySequence(ctx: CanvasRenderingContext2D, source: HTMLElement, dots: GlyphParticle[], pull: Point) {
  let raf = 0;
  const started = performance.now();
  const canvas = ctx.canvas;
  let width = 0;
  let height = 0;
  const colors = ['#280c14', '#692033', '#a63448', '#ec5865', '#ff9c93'];
  const bands = 5;
  const batches = colors.map((color, tone) => ({
    color,
    groups: Array.from({ length: bands }, (_, band) =>
      dots.filter(dot => Math.floor(dot.pigment * colors.length) === tone && Math.floor(dot.seed * bands) === band)),
  }));
  const render = (now: number) => {
    if (width !== innerWidth || height !== innerHeight) {
      width = innerWidth;
      height = innerHeight;
      const ratio = Math.min(devicePixelRatio, 1.55);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    ctx.clearRect(0, 0, width, height);
    const age = (now - started) / 1000;
    const bounds = source.getBoundingClientRect();
    const centerX = bounds.left + bounds.width * .46;
    const centerY = bounds.top + bounds.height * .49;
    const collapse = Math.min(1, age / .96) ** 1.44;
    const originX = centerX + (pull.x - centerX) * collapse * .62;
    const originY = centerY + (pull.y - centerY) * collapse * .62;
    const appear = Math.min(1, .54 + age * 2.7);
    const scale = Math.min(width, height);
    let visible = false;

    for (const { color, groups } of batches) {
      ctx.fillStyle = color;
      groups.forEach((group, band) => {
        if (!group.length) return;
        // Start the throw during the collapse and fade each cohort while it is still in flight.
        const progress = Math.max(0, (age - .64 - band * .026) / .72);
        if (progress >= 1) return;
        visible = true;
        const flight = progress ** 1.72;
        const fade = Math.min(1, (1 - progress) / .40) ** 1.4;
        ctx.globalAlpha = appear * fade;
        ctx.beginPath();
        for (const dot of group) {
          const x = dot.x + bounds.left - centerX;
          const y = dot.y + bounds.top - centerY;
          const angle = collapse * (.48 + dot.seed * 2.0) + flight * .34;
          const fold = 1 - collapse * .84;
          const drift = Math.sin(dot.seed * 67 + age * 9) * collapse * (1 - flight) * 6;
          const depth = flight * (.82 + dot.seed * .13);
          const perspective = 1 / (1 - depth);
          const scatter = flight * (.06 + dot.seed * .18) * scale;
          const heading = dot.seed * 53 + dot.pigment * 17;
          const px = originX + ((x * Math.cos(angle) - y * Math.sin(angle)) * fold + drift + Math.cos(heading) * scatter) * perspective;
          const py = originY + ((x * Math.sin(angle) + y * Math.cos(angle)) * fold + drift + Math.sin(heading) * scatter) * perspective;
          const radius = Math.min(4.6, (.77 + dot.seed * .41) * perspective);
          ctx.moveTo(px + radius, py);
          ctx.arc(px, py, radius, 0, Math.PI * 2);
        }
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
    if (visible) raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, width, height);
  };
}

function teleport(overlay: HTMLElement, heading: HTMLElement) {
  const source = heading.getBoundingClientRect();
  const style = getComputedStyle(heading);
  const copy = document.createElement('div');
  copy.className = styles.teleported;
  copy.textContent = heading.textContent;
  const narrow = innerWidth <= 640;
  const available = narrow ? innerWidth * .66 : Math.max(180, Math.min(source.width, innerWidth * .39));
  const left = source.left + source.width / 2 < innerWidth / 2
    ? innerWidth - available - Math.max(24, innerWidth * .07)
    : Math.max(24, innerWidth * .07);
  const top = narrow
    ? innerHeight * (source.top > innerHeight / 2 ? .25 : .56)
    : Math.max(90, Math.min(source.top - 18, innerHeight - 185));
  Object.assign(copy.style, {
    left: `${left}px`, top: `${top}px`, width: `${available}px`,
    fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontStyle: style.fontStyle,
    fontSize: narrow ? `${Math.min(parseFloat(style.fontSize), 27)}px` : style.fontSize,
    letterSpacing: style.letterSpacing, lineHeight: narrow ? '1.16' : style.lineHeight,
  });
  const departures = [
    [source.left + Math.min(source.width * .24, 135), source.top + Math.min(source.height * .49, 70)],
    [left + Math.min(available * .38, 115), top + Math.min(source.height * .49, 70)],
  ].map(([x, y]) => {
    const portal = document.createElement('div');
    portal.className = styles.spacePortal;
    portal.style.left = `${x}px`;
    portal.style.top = `${y}px`;
    return portal;
  });
  overlay.append(...departures, copy);
}

function mindTakeover(overlay: HTMLElement, heading: HTMLElement) {
  const bounds = heading.getBoundingClientRect();
  const panel = document.createElement('div');
  panel.className = styles.mindPanel;
  panel.style.left = `${bounds.left}px`;
  panel.style.top = `${Math.max(80, Math.min(bounds.top - 4, innerHeight - 120))}px`;
  panel.style.width = `${Math.min(430, bounds.width)}px`;
  const label = document.createElement('span');
  label.textContent = 'STARK INTERFACE · CHANNEL OPEN';
  const dialogue = document.createElement('p');
  dialogue.textContent = heading.id === 'hero-title'
    ? 'You found the signal. I have the display from here.'
    : 'I’m rerouting the Atlas. Let me show you a different system.';
  panel.append(label, dialogue);
  overlay.append(panel);
}

export default function StoneCinematics() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const site = document.querySelector<HTMLElement>('.site-frame');
    const overlay = content.current;
    const ctx = canvas.current?.getContext('2d');
    if (!site || !overlay || !ctx) return;
    let previous: string | undefined;
    let activeHeading: HTMLElement | undefined;
    let stop: (() => void) | undefined;
    const clear = () => {
      stop?.();
      stop = undefined;
      activeHeading?.removeAttribute('data-stone-displaced');
      activeHeading = undefined;
      overlay.replaceChildren();
    };
    const update = () => {
      const stone = site.inert ? undefined : site.dataset.infinityStone;
      if (stone === previous) return;
      previous = stone;
      clear();
      if (stone !== 'space' && stone !== 'mind' && stone !== 'reality') return;
      const heading = visibleHeading();
      if (!heading) return;

      if (stone === 'space') teleport(overlay, heading);
      if (stone === 'mind') mindTakeover(overlay, heading);
      if (stone === 'reality') {
        const dots = sampleGlyphs(heading);
        if (!dots.length) return;
        const bounds = heading.getBoundingClientRect();
        const destination = { x: bounds.left + bounds.width * .54, y: bounds.top + bounds.height * .48 };
        stop = realitySequence(ctx, heading, dots, destination);
      }
      activeHeading = heading;
      heading.dataset.stoneDisplaced = stone;
    };
    const watch = new MutationObserver(update);
    watch.observe(site, { attributes: true, attributeFilter: ['data-infinity-stone', 'inert'] });
    update();
    return () => {
      watch.disconnect();
      clear();
    };
  }, []);

  return createPortal(
    <div className={styles.stoneOverlay} aria-hidden="true">
      <canvas ref={canvas} />
      <div ref={content} />
    </div>,
    document.body,
  );
}
