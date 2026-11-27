import { CONFIG } from './config.js';

/**
 * Son via Web Audio : faible latence et fiable sur iOS une fois « déverrouillé »
 * par un geste de l'utilisateur (le bouton Jouer).
 */
class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.buffers = {};
    this.muted = false;
  }

  /** À appeler dans un gestionnaire de clic/touch. */
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.load('buzzer', CONFIG.buzzerUrl);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    // Un buffer silencieux finit de déverrouiller les vieux Safari.
    const src = this.ctx.createBufferSource();
    src.buffer = this.ctx.createBuffer(1, 1, 22050);
    src.connect(this.master);
    src.start(0);
  }

  async load(name, url) {
    try {
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      this.buffers[name] = await new Promise((ok, ko) => this.ctx.decodeAudioData(data, ok, ko));
    } catch (e) {
      console.warn('[Tengo Yo] Son non chargé :', url, e);
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.01);
  }

  get ready() {
    return this.ctx && this.ctx.state === 'running' && !this.muted;
  }

  play(name, volume = 1) {
    if (!this.ready || !this.buffers[name]) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.buffer = this.buffers[name];
    src.connect(gain).connect(this.master);
    src.start();
  }

  /** Bip synthétisé : compte à rebours et tic des dernières secondes. */
  beep({ freq = 880, duration = 0.08, volume = 0.25, type = 'square' } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /** Petit « whoosh » de bruit filtré pour le retournement de carte. */
  whoosh({ duration = 0.28, volume = 0.18 } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + duration);
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  }
}

export const sound = new Sound();

export function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignoré */ }
  }
}

/** Empêche l'écran de se mettre en veille pendant la partie. */
export const wakeLock = {
  sentinel: null,
  wanted: false,
  async request() {
    this.wanted = true;
    if (!('wakeLock' in navigator) || this.sentinel) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => { this.sentinel = null; });
    } catch { /* refusé (batterie faible, etc.) */ }
  },
  release() {
    this.wanted = false;
    this.sentinel?.release();
    this.sentinel = null;
  },
};
