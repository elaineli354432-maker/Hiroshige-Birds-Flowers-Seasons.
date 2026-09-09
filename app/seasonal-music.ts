// Real recordings routed through Web Audio; construction never starts playback.
export type Recording = { url: string; gain: number };
type Voice = { source: AudioBufferSourceNode; gain: GainNode; target: number };
export const SEASON_CROSSFADE = 3.2;
export const MUSIC_MASTER_GAIN = 0.5;

export class SeasonalMusic {
  private context: AudioContext;
  private master: GainNode;
  private recordings: Record<string, Recording>;
  private voices = new Map<string, Voice>();
  private request = 0;
  private loading: AbortController | null = null;
  private cleanup: ReturnType<typeof setTimeout> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private closed = false;
  private selected = '';

  constructor(recordings: Record<string, Recording>, context = new AudioContext()) {
    this.recordings = recordings;
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);
  }

  // Call directly in the button handler so resume retains the user gesture.
  async enable(season: string) {
    if (this.closed) return false;
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.enabled = true;
    try {
      await this.context.resume();
      if (!this.enabled || this.closed) return false;
      const playing = await this.setSeason(season);
      if (!playing || !this.enabled || this.closed) return false;
      this.ramp(this.master.gain, MUSIC_MASTER_GAIN, 1.2);
      return true;
    } catch (error) {
      this.disable();
      throw error;
    }
  }

  async setSeason(season: string) {
    if (!this.enabled || this.closed) return false;
    const recording = this.recordings[season];
    if (!recording) throw new Error(`Recording unavailable: ${season}`);
    const request = ++this.request;
    this.loading?.abort();
    this.selected = season;
    let voice = this.voices.get(season);
    if (!voice) {
      const loading = new AbortController();
      this.loading = loading;
      try {
        const response = await fetch(recording.url, { signal: loading.signal });
        if (!response.ok) throw new Error(`Audio download failed (${response.status})`);
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        if (request !== this.request || !this.enabled || this.closed) return false;
        const gain = this.context.createGain();
        gain.gain.value = 0;
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain).connect(this.master);
        source.start();
        voice = { source, gain, target: 0 };
        this.voices.set(season, voice);
      } catch (error) {
        if (loading.signal.aborted || request !== this.request || this.closed) return false;
        throw error;
      }
    }
    if (request !== this.request || !this.enabled || this.closed) return false;
    // Linear gain crossfade: weights sum to at most one, including interrupted fades.
    for (const [key, item] of this.voices) {
      item.target = key === season ? Math.max(0, Math.min(1, recording.gain)) : 0;
      this.ramp(item.gain.gain, item.target, SEASON_CROSSFADE);
    }
    if (this.cleanup) clearTimeout(this.cleanup);
    this.cleanup = setTimeout(() => {
      for (const [key, item] of this.voices) {
        if (item.target === 0 && key !== this.selected) {
          item.source.stop();
          item.source.disconnect();
          item.gain.disconnect();
          this.voices.delete(key);
        }
      }
    }, SEASON_CROSSFADE * 1000 + 100);
    return true;
  }

  disable() {
    this.enabled = false;
    this.request++;
    this.loading?.abort();
    if (this.closed) return;
    this.ramp(this.master.gain, 0, 0.7);
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (!this.enabled && !this.closed) void this.context.suspend();
    }, 760);
  }

  close() {
    this.disable();
    this.closed = true;
    if (this.cleanup) clearTimeout(this.cleanup);
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    for (const item of this.voices.values()) {
      item.source.stop();
      item.source.disconnect();
      item.gain.disconnect();
    }
    this.voices.clear();
    void this.context.close();
  }

  private ramp(parameter: AudioParam, value: number, duration: number) {
    const now = this.context.currentTime;
    parameter.cancelAndHoldAtTime(now);
    parameter.linearRampToValueAtTime(value, now + duration);
  }
}
