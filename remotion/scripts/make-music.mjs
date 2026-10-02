#!/usr/bin/env node
// Procedural soundtrack for the SD showreel. No samples, no external assets:
// every sound is synthesised here and written to public/audio/track.wav,
// then encoded to track.mp3 with ffmpeg when it is available.
//
// Tempo: 120 BPM, 4/4 → one bar = 2 s, one 16th = 0.125 s. The video
// timeline (remotion/src/timeline.ts) is laid out on the same grid.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SR = 44100;
const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const STEP = BEAT / 4;
const DURATION = 60;
const N = SR * DURATION;

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/audio');
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- buses
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus();
const bass = bus();
const pads = bus();
const plucks = bus();
const fx = bus();
const sendRev = bus();
const sendDly = bus();
const duckEnv = new Float32Array(N).fill(1);
const kickTimes = [];

// ---------------------------------------------------------------- utils
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 20240601;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};

function polyblep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

function biquad(type, f0, Q) {
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const set = (f, q = Q) => {
    f = Math.max(20, Math.min(SR * 0.45, f));
    const w = (2 * Math.PI * f) / SR;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    const al = sn / (2 * q);
    if (type === 'lp') {
      b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2;
    } else if (type === 'hp') {
      b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2;
    } else {
      b0 = al; b1 = 0; b2 = -al;
    }
    const a0 = 1 + al;
    a1 = (-2 * cs) / a0; a2 = (1 - al) / a0;
    b0 /= a0; b1 /= a0; b2 /= a0;
  };
  set(f0);
  const run = (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
  return { set, run };
}

// Render a voice into a bus. fn(t, i, k) returns a sample or [l, r].
function render(target, startSec, lenSec, fn, { gain = 1, pan = 0, sends = {} } = {}) {
  const start = Math.round(startSec * SR);
  const len = Math.min(Math.round(lenSec * SR), N - start);
  if (start < 0 || len <= 0) return;
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < len; i++) {
    const k = start + i;
    const s = fn(i / SR, i, k);
    let l, r;
    if (typeof s === 'number') { l = s * gl; r = s * gr; } else { l = s[0] * gl; r = s[1] * gr; }
    target.L[k] += l;
    target.R[k] += r;
    if (sends.rev) { sendRev.L[k] += l * sends.rev; sendRev.R[k] += r * sends.rev; }
    if (sends.dly) { sendDly.L[k] += l * sends.dly; sendDly.R[k] += r * sends.dly; }
  }
}

// ---------------------------------------------------------------- drums
function kick(t0, vel = 1) {
  kickTimes.push(t0);
  let ph = 0;
  render(drums, t0, 0.45, (t) => {
    const f = 44 + 130 * Math.exp(-t * 40);
    ph += (2 * Math.PI * f) / SR;
    const body = Math.sin(ph) * Math.exp(-t * 7.5);
    const click = rnd() * Math.exp(-t * 500) * 0.5;
    return Math.tanh((body * 1.6 + click) * 1.2) * vel;
  }, { gain: 0.95 });
}

function clap(t0, vel = 1) {
  const hp = biquad('hp', 900, 0.7);
  const lp = biquad('lp', 7000, 0.7);
  render(drums, t0, 0.35, (t) => {
    let env = 0;
    for (const d of [0, 0.011, 0.022]) if (t >= d) env += Math.exp(-(t - d) * 90);
    env += Math.exp(-t * 14) * 0.9;
    return lp.run(hp.run(rnd())) * env * vel;
  }, { gain: 0.5, sends: { rev: 0.35 } });
}

function snare(t0, vel = 1) {
  const hp = biquad('hp', 600, 0.8);
  let ph = 0;
  render(drums, t0, 0.25, (t) => {
    ph += (2 * Math.PI * 185) / SR;
    const tone = Math.sin(ph) * Math.exp(-t * 30) * 0.5;
    return (hp.run(rnd()) * Math.exp(-t * 22) + tone) * vel;
  }, { gain: 0.5, sends: { rev: 0.3 } });
}

function hat(t0, vel = 1, open = false) {
  const hp = biquad('hp', 7500, 0.8);
  render(drums, t0, open ? 0.35 : 0.08, (t) => hp.run(rnd()) * Math.exp(-t * (open ? 11 : 65)) * vel, {
    gain: 0.2,
    pan: 0.15,
  });
}

function roll(t0, count, stepSec, v0, v1) {
  for (let j = 0; j < count; j++) snare(t0 + j * stepSec, v0 + ((v1 - v0) * j) / Math.max(1, count - 1));
}

// ---------------------------------------------------------------- tonal
function bassNote(t0, len, midi, vel = 1, bright = 1) {
  const f = mtof(midi);
  const dt = f / SR;
  let ph = 0;
  let ph2 = 0;
  const lp = biquad('lp', 400, 1.1);
  render(bass, t0, len, (t, i, k) => {
    ph += dt; if (ph >= 1) ph -= 1;
    ph2 += (2 * Math.PI * f) / SR;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sub = Math.sin(ph2);
    if ((i & 31) === 0) lp.set(260 + 1100 * bright * Math.exp(-t * 9));
    const tail = Math.max(0, Math.min(1, (len - t) / 0.02));
    const env = Math.min(1, t * 400) * Math.exp(-t * 2) * tail;
    return (lp.run(saw) * 0.8 + sub * 0.65) * env * vel * duckEnv[k];
  }, { gain: 0.55 });
}

function padChord(t0, len, notes, { cutoff = 900, vel = 1 } = {}) {
  const voices = [];
  for (const m of notes) {
    for (const d of [-1, 0, 1]) voices.push({ dt: (mtof(m) * (1 + d * 0.004)) / SR, ph: Math.abs(rnd()), side: d });
  }
  const lpL = biquad('lp', cutoff, 0.8);
  const lpR = biquad('lp', cutoff, 0.8);
  const atk = 0.45;
  const rel = 0.7;
  const per = notes.length * 2;
  render(pads, t0, len + rel, (t, i, k) => {
    let l = 0;
    let r = 0;
    for (const v of voices) {
      v.ph += v.dt; if (v.ph >= 1) v.ph -= 1;
      const s = 2 * v.ph - 1 - polyblep(v.ph, v.dt);
      if (v.side <= 0) l += s;
      if (v.side >= 0) r += s;
    }
    const env = Math.min(1, t / atk) * (t > len ? Math.max(0, 1 - (t - len) / rel) : 1);
    if ((i & 63) === 0) {
      const c = cutoff * (0.75 + 0.25 * Math.sin(t * 1.1 + 1));
      lpL.set(c); lpR.set(c);
    }
    const g = (env * vel * (0.35 + 0.65 * duckEnv[k])) / per;
    return [lpL.run(l) * g, lpR.run(r) * g];
  }, { gain: 0.55, sends: { rev: 0.5 } });
}

function pluck(t0, len, midi, vel = 1, pan = 0, { gain = 0.3, dly = 0.4 } = {}) {
  const f = mtof(midi);
  const dt = f / SR;
  let ph = 0;
  const lp = biquad('lp', 3000, 1.4);
  render(plucks, t0, len, (t, i) => {
    ph += dt; if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sq = (ph < 0.5 ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 0.5) % 1, dt);
    if ((i & 15) === 0) lp.set(500 + 5200 * Math.exp(-t * 18));
    const env = Math.min(1, t * 2000) * Math.exp(-t * 9);
    return lp.run(saw * 0.6 + sq * 0.4) * env * vel;
  }, { gain, pan, sends: { rev: 0.25, dly } });
}

function stab(t0, notes, vel = 1) {
  notes.forEach((m, j) => pluck(t0, 0.5, m, vel * 0.9, (j - 1) * 0.4, { gain: 0.28, dly: 0.3 }));
}

// ---------------------------------------------------------------- fx
function riser(t0, len, vel = 1) {
  const lp = biquad('lp', 200, 0.9);
  let ph = 0;
  render(fx, t0, len, (t, i) => {
    const p = t / len;
    if ((i & 31) === 0) lp.set(150 * Math.pow(80, p));
    ph += (2 * Math.PI * (80 + 700 * p * p)) / SR;
    const tone = Math.sin(ph) * 0.25 * p;
    return (lp.run(rnd()) * (0.3 + 0.7 * p * p) + tone) * vel;
  }, { gain: 0.32, sends: { rev: 0.3 } });
}

function crash(t0, vel = 1) {
  const hp = biquad('hp', 4000, 0.7);
  render(fx, t0, 1.8, (t) => hp.run(rnd()) * Math.exp(-t * 3.2) * vel, { gain: 0.16, sends: { rev: 0.5 } });
}

function impact(t0) {
  let ph = 0;
  const lp = biquad('lp', 2500, 0.7);
  render(fx, t0, 3.2, (t) => {
    const f = 38 + 100 * Math.exp(-t * 12);
    ph += (2 * Math.PI * f) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.5);
    const burst = lp.run(rnd()) * Math.exp(-t * 6) * 0.7;
    return Math.tanh(boom * 1.5 + burst);
  }, { gain: 0.9, sends: { rev: 0.7 } });
}

// ---------------------------------------------------------------- score
// C minor: Cm9 → Ab(add9) → Ebmaj9 → Bb(add9)
const PROG = [
  { root: 36, pad: [48, 51, 55, 58, 62] },
  { root: 32, pad: [44, 48, 51, 55, 58] },
  { root: 39, pad: [51, 55, 58, 62, 65] },
  { root: 34, pad: [46, 50, 53, 58, 60] },
];
const ARP = {
  A: [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 2, 1, 3, 2, 4],
  B: [0, -1, 2, 4, 3, -1, 1, 4, 0, -1, 2, 4, 3, 2, 1, -1],
  C: [4, 2, 0, 2, 4, 3, 1, 3, 4, 2, 0, 2, 4, 3, 1, 0],
};
const BASS = {
  A: [0, 0, 12, 0, 0, 12, 0, 0],
  B: [0, -1, 0, 12, -1, 0, -1, 12],
};

function sectionFor(b) {
  if (b < 2) return 'intro';
  if (b < 8) return 'drop';
  if (b < 12) return 'scratch';
  if (b < 16) return 'seo';
  if (b < 18) return 'break';
  if (b < 20) return 'rebuild';
  if (b < 23) return 'three';
  if (b < 26) return 'climax';
  if (b < 28) return 'cta';
  return 'end';
}

const tonal = [];
const later = (fn) => tonal.push(fn);

function hats16(t0, accent = 0.35) {
  for (let s = 0; s < 16; s++) {
    const v = s % 2 === 0 ? (s % 4 === 2 ? 0.9 : 0.55) : accent;
    hat(t0 + s * STEP, v);
  }
}
function hats8(t0, scale = 1) {
  for (let s = 0; s < 16; s += 2) hat(t0 + s * STEP, (s % 4 === 2 ? 0.9 : 0.55) * scale);
}
function arp(t0, pattern, chord, vel, octave = 12, pan = 0.5, opts) {
  pattern.forEach((idx, s) => {
    if (idx < 0) return;
    later(() => pluck(t0 + s * STEP, STEP * 1.6, chord.pad[idx] + octave, vel, s % 2 === 0 ? -pan : pan, opts));
  });
}
function bassline(t0, pattern, chord, vel = 1, bright = 1) {
  pattern.forEach((off, s) => {
    if (off < 0) return;
    later(() => bassNote(t0 + s * STEP * 2, STEP * 1.9, chord.root + off, vel, bright));
  });
}

for (let b = 0; b < 30; b++) {
  const t0 = b * BAR;
  const sec = sectionFor(b);
  const chord = PROG[b % 4];
  const phraseEnd = b % 4 === 3;

  switch (sec) {
    case 'intro': {
      for (let q = 0; q < 4; q++) kick(t0 + q * BEAT, 0.42);
      hats8(t0, 0.35 + 0.3 * b);
      later(() => padChord(t0, BAR, chord.pad, { cutoff: 480 + 220 * b, vel: 0.55 + 0.25 * b }));
      if (b === 0) riser(1.5, 2.5, 0.9);
      if (b === 1) roll(t0 + 2 * BEAT, 8, STEP, 0.3, 1);
      break;
    }
    case 'drop':
    case 'scratch':
    case 'seo': {
      if (b === 2 || b === 8 || b === 12) crash(t0);
      for (let q = 0; q < 4; q++) kick(t0 + q * BEAT);
      clap(t0 + BEAT);
      clap(t0 + 3 * BEAT);
      hats8(t0);
      if (b % 2 === 1) hat(t0 + 14 * STEP, 0.7, true);
      const cutoff = sec === 'drop' ? 900 : sec === 'scratch' ? 1400 : 1100;
      later(() => padChord(t0, BAR, chord.pad, { cutoff, vel: 0.9 }));
      bassline(t0, sec === 'seo' ? BASS.B : BASS.A, chord);
      arp(t0, sec === 'seo' ? ARP.B : ARP.A, chord, 0.8);
      if (b === 6) {
        // "TypeScript × React × Laravel" – three stabs on the beat
        [0, 1, 2].forEach((q) => later(() => stab(t0 + q * BEAT, [chord.pad[0] + 12, chord.pad[2] + 12, chord.pad[4] + 12], 1)));
      }
      if (phraseEnd) roll(t0 + 3 * BEAT, 4, STEP, 0.5, 1);
      break;
    }
    case 'break': {
      hats16(t0, 0.25);
      later(() => padChord(t0, BAR, chord.pad, { cutoff: 620, vel: 1 }));
      later(() => bassNote(t0, BAR, chord.root, 0.7, 0.25));
      arp(t0, ARP.A, chord, 0.5, 12, 0.6, { gain: 0.26, dly: 0.5 });
      break;
    }
    case 'rebuild': {
      for (let q = 0; q < 4; q++) kick(t0 + q * BEAT);
      clap(t0 + BEAT);
      clap(t0 + 3 * BEAT);
      hats8(t0);
      later(() => padChord(t0, BAR, chord.pad, { cutoff: 1000, vel: 0.9 }));
      bassline(t0, BASS.A, chord);
      arp(t0, ARP.A, chord, 0.8);
      if (b === 18) riser(t0, 2 * BAR, 1);
      if (b === 19) roll(t0 + 2 * BEAT, 8, STEP, 0.4, 1);
      break;
    }
    case 'three':
    case 'climax': {
      if (b === 20 || b === 23 || b === 24 || b === 25) crash(t0, b >= 23 ? 1 : 0.8);
      for (let q = 0; q < 4; q++) kick(t0 + q * BEAT);
      clap(t0 + BEAT);
      clap(t0 + 3 * BEAT);
      hats16(t0, sec === 'climax' ? 0.45 : 0.35);
      hat(t0 + 14 * STEP, 0.8, true);
      later(() => padChord(t0, BAR, chord.pad, { cutoff: 1500, vel: 1 }));
      bassline(t0, sec === 'climax' ? BASS.A : BASS.B, chord, 1, 1.2);
      arp(t0, ARP.C, chord, 0.9);
      arp(t0, ARP.C, chord, 0.45, 24, 0.8, { gain: 0.22, dly: 0.5 });
      if (sec === 'climax') later(() => stab(t0, [chord.pad[0] + 12, chord.pad[2] + 12, chord.pad[4] + 12], 1));
      if (b === 25) roll(t0 + 3 * BEAT, 8, STEP / 2, 0.5, 1);
      break;
    }
    case 'cta': {
      if (b === 26) crash(t0, 0.9);
      hats8(t0, 0.35);
      later(() => padChord(t0, BAR, chord.pad, { cutoff: 800, vel: 0.95 }));
      later(() => bassNote(t0, BAR, chord.root, 0.55, 0.2));
      arp(t0, ARP.B, chord, 0.42, 12, 0.7, { gain: 0.26, dly: 0.55 });
      if (b === 26) riser(t0 + BAR, BAR, 0.8);
      break;
    }
    case 'end': {
      if (b === 28) {
        impact(t0);
        crash(t0, 1);
        later(() => padChord(t0, 2.6, PROG[0].pad, { cutoff: 1100, vel: 1 }));
        later(() => stab(t0, [60, 67, 72, 79], 0.9));
        later(() => bassNote(t0, 2.4, 36, 0.8, 0.15));
      }
      break;
    }
  }
}

// Sidechain envelope from the kicks, then render everything tonal.
for (const kt of kickTimes) {
  const start = Math.round(kt * SR);
  const len = Math.round(0.32 * SR);
  for (let i = 0; i < len && start + i < N; i++) {
    const d = 1 - 0.75 * Math.exp(-(i / SR) * 13);
    if (d < duckEnv[start + i]) duckEnv[start + i] = d;
  }
}
for (const fn of tonal) fn();

// ---------------------------------------------------------------- effects
function pingPong(input, out, timeSec, fb, wet) {
  const d = Math.round(timeSec * SR);
  const bufL = new Float32Array(N);
  const bufR = new Float32Array(N);
  const lpL = biquad('lp', 3200, 0.7);
  const lpR = biquad('lp', 3200, 0.7);
  for (let k = 0; k < N; k++) {
    const dl = k >= d ? bufL[k - d] : 0;
    const dr = k >= d ? bufR[k - d] : 0;
    bufL[k] = input.L[k] + lpL.run(dr) * fb;
    bufR[k] = input.R[k] + lpR.run(dl) * fb;
    out.L[k] += dl * wet;
    out.R[k] += dr * wet;
  }
}

function reverb(input, out, wet) {
  const combs = [1557, 1617, 1491, 1422];
  const aps = [225, 556];
  for (const [inp, dst, offset] of [[input.L, out.L, 0], [input.R, out.R, 23]]) {
    const acc = new Float32Array(N);
    for (const c of combs) {
      const d = c + offset;
      const buf = new Float32Array(N);
      let lp = 0;
      for (let k = 0; k < N; k++) {
        const y = k >= d ? buf[k - d] : 0;
        lp = lp * 0.35 + y * 0.65;
        buf[k] = inp[k] + lp * 0.86;
        acc[k] += y;
      }
    }
    let sig = acc;
    for (const a of aps) {
      const yb = new Float32Array(N);
      for (let k = 0; k < N; k++) {
        const xd = k >= a ? sig[k - a] : 0;
        const yd = k >= a ? yb[k - a] : 0;
        yb[k] = -0.5 * sig[k] + xd + 0.5 * yd;
      }
      sig = yb;
    }
    for (let k = 0; k < N; k++) dst[k] += (sig[k] * wet) / combs.length;
  }
}

const dlyRet = bus();
const revRet = bus();
pingPong(sendDly, dlyRet, STEP * 3, 0.42, 0.5);
reverb(sendRev, revRet, 0.55);

// ---------------------------------------------------------------- master
const master = bus();
let peak = 0;
for (let k = 0; k < N; k++) {
  const l = drums.L[k] + bass.L[k] + pads.L[k] + plucks.L[k] + fx.L[k] + dlyRet.L[k] + revRet.L[k];
  const r = drums.R[k] + bass.R[k] + pads.R[k] + plucks.R[k] + fx.R[k] + dlyRet.R[k] + revRet.R[k];
  master.L[k] = Math.tanh(l * 1.15);
  master.R[k] = Math.tanh(r * 1.15);
  peak = Math.max(peak, Math.abs(master.L[k]), Math.abs(master.R[k]));
}
const norm = 0.93 / (peak || 1);
let sumSq = 0;
for (let k = 0; k < N; k++) {
  master.L[k] *= norm;
  master.R[k] *= norm;
  sumSq += master.L[k] * master.L[k] + master.R[k] * master.R[k];
}
const rmsDb = 10 * Math.log10(sumSq / (2 * N));

// ---------------------------------------------------------------- write
const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, master.L[k])) * 32767), 44 + k * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, master.R[k])) * 32767), 46 + k * 4);
}
const wavPath = path.join(outDir, 'track.wav');
fs.writeFileSync(wavPath, wav);
console.log(`wrote ${wavPath} (${DURATION}s, peak ${peak.toFixed(2)} → normalised, RMS ${rmsDb.toFixed(1)} dBFS)`);

try {
  const mp3Path = path.join(outDir, 'track.mp3');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', '192k', mp3Path]);
  console.log(`wrote ${mp3Path}`);
} catch (err) {
  console.warn('ffmpeg not available or failed; keeping WAV only:', err.message);
}
