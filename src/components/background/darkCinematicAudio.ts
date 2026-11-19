const missileUrl = new URL('../../../missle.mp3', import.meta.url).href;
const glassUrl = new URL('../../../glassEffect.mp3', import.meta.url).href;
const doomUrl = new URL('../../../doom.mp3', import.meta.url).href;

export class DarkCinematicAudio {
  private readonly context = new AudioContext();
  private readonly loadAbort = new AbortController();
  private readonly ironVoices = new Set<AudioBufferSourceNode>();
  private missile?: AudioBuffer;
  private glass?: AudioBuffer;
  private doom?: AudioBuffer;
  private doomPending = false;
  private doomVoice?: AudioBufferSourceNode;

  constructor() {
    this.context.addEventListener('statechange', this.playDoomWhenReady);
    void this.load(missileUrl).then(clip => { this.missile = clip; });
    void this.load(glassUrl).then(clip => { this.glass = clip; });
    void this.load(doomUrl).then(clip => {
      this.doom = clip;
      this.playDoomWhenReady();
    });
  }

  resume = () => {
    if (this.context.state === 'running') this.playDoomWhenReady();
    else void this.context.resume().then(this.playDoomWhenReady, () => {});
  };

  arriveAtDoom() {
    if (this.doomVoice) return;
    this.doomPending = true;
    this.playDoomWhenReady();
  }

  leaveDoom() {
    this.doomPending = false;
    this.doomVoice?.stop();
    this.doomVoice = undefined;
  }

  launch(side: number, flightSeconds: number) {
    if (this.missile) this.playIron(this.missile, side, .278, flightSeconds, .44, .135);
  }

  impact(index: number, screenX: number, final: boolean) {
    const pan = (Math.min(1, Math.max(0, screenX)) * 2 - 1) * .72;
    if (this.glass) this.playIron(this.glass, pan, .049, final ? 1.92 : .33 + index * .037, final ? .66 : .43 + index * .035, final ? .25 : .14);
  }

  stopIron() {
    for (const voice of this.ironVoices) voice.stop();
    this.ironVoices.clear();
  }

  dispose() {
    this.loadAbort.abort();
    this.context.removeEventListener('statechange', this.playDoomWhenReady);
    this.leaveDoom();
    this.stopIron();
    void this.context.close().catch(() => {});
  }

  private playDoomWhenReady = () => {
    if (!this.doomPending || !this.doom || this.context.state !== 'running') return;
    this.doomPending = false;
    const voice = this.play(this.doom, 0, 0, this.doom.duration, .64, .24);
    this.doomVoice = voice;
    voice.addEventListener('ended', () => {
      if (this.doomVoice === voice) this.doomVoice = undefined;
    }, { once: true });
  };

  private async load(url: string) {
    try {
      const response = await fetch(url, { signal: this.loadAbort.signal });
      if (response.ok) return await this.context.decodeAudioData(await response.arrayBuffer());
    } catch {
      // A failed or aborted clip should leave the animation usable.
    }
  }

  private playIron(buffer: AudioBuffer, side: number, offset: number, length: number, volume: number, tail: number) {
    if (this.context.state !== 'running') return;
    const voice = this.play(buffer, side, offset, length, volume, tail);
    this.ironVoices.add(voice);
    voice.addEventListener('ended', () => this.ironVoices.delete(voice), { once: true });
  }

  private play(buffer: AudioBuffer, side: number, offset: number, length: number, volume: number, tail: number) {
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .009);
    gain.gain.setValueAtTime(volume, now + length - tail);
    gain.gain.exponentialRampToValueAtTime(.0001, now + length);
    const pan = this.context.createStereoPanner();
    pan.pan.value = side;
    source.connect(gain).connect(pan).connect(this.context.destination);

    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    }, { once: true });
    source.start(now, offset, length);
    return source;
  }
}
