import test from 'node:test';
import assert from 'node:assert/strict';
import { SeasonalMusic, MUSIC_MASTER_GAIN, SEASON_CROSSFADE } from '../app/seasonal-music.ts';

function setup() {
  const gains = [], sources = [];
  const context = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    resumes: 0,
    async resume() { this.resumes++; this.state = 'running'; },
    async suspend() { this.state = 'suspended'; },
    async close() { this.state = 'closed'; },
    async decodeAudioData() { return {}; },
    createGain() {
      const node = { gain: { value: 0, cancelAndHoldAtTime() {}, linearRampToValueAtTime(value, time) { this.value = value; this.time = time; } }, connect() {}, disconnect() {} };
      gains.push(node);
      return node;
    },
    createBufferSource() {
      const node = { connect(target) { return target; }, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(node);
      return node;
    },
  };
  const player = new SeasonalMusic({ Spring: { url: '/spring.mp3', gain: 1 }, Winter: { url: '/winter.ogg', gain: 0.7 } }, context);
  return { player, context, gains, sources };
}

test('manual activation, constant-power bound, mute and resource disposal', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; };
  const { player, context, gains, sources } = setup();
  try {
    assert.equal(context.resumes, 0);
    assert.equal(requests, 0);
    assert.equal(await player.setSeason('Winter'), false);
    assert.equal(requests, 0);
    assert.equal(await player.enable('Spring'), true);
    assert.equal(gains[0].gain.value, MUSIC_MASTER_GAIN);
    assert.equal(sources[0].started, true);
    await player.setSeason('Winter');
    assert.equal(gains[1].gain.value, 0);
    assert.equal(gains[2].gain.value, 0.7);
    assert.equal(gains[2].gain.time, SEASON_CROSSFADE);
    player.disable();
    assert.equal(gains[0].gain.value, 0);
    assert.equal(await player.setSeason('Spring'), false);
  } finally {
    player.close();
    assert.ok(sources.every(source => source.stopped));
    globalThis.fetch = originalFetch;
  }
});

test('failed download never reports playback success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  const { player, gains, sources } = setup();
  try {
    await assert.rejects(player.enable('Spring'), /404/);
    assert.equal(gains[0].gain.value, 0);
    assert.equal(sources.length, 0);
  } finally { player.close(); globalThis.fetch = originalFetch; }
});

test('mute while loading prevents late audible playback', async () => {
  const originalFetch = globalThis.fetch;
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const { player, sources } = setup();
  try {
    const pending = player.enable('Spring');
    await Promise.resolve();
    player.disable();
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    assert.equal(await pending, false);
    assert.equal(sources.length, 0);
  } finally { player.close(); globalThis.fetch = originalFetch; }
});
