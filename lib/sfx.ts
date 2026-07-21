"use client"

// Lightweight Web Audio SFX + ambient music engine. No audio files needed —
// everything is synthesized so it loads instantly and never 404s.

let ctx: AudioContext | null = null
let musicNodes: { stop: () => void } | null = null
let masterGain: GainNode | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.6
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function out(): AudioNode | null {
  getCtx()
  return masterGain
}

/** Helper: short filtered noise burst. */
function noiseBurst(c: AudioContext, o: AudioNode, t: number, dur: number, freq: number, gain: number) {
  const len = Math.ceil(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = freq
  filter.Q.value = 1.2
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  src.connect(filter).connect(g).connect(o)
  src.start(t)
  src.stop(t + dur)
}

/** Wooden gavel knock — a vote being cast. Decisive but not harsh. */
export function playVote() {
  const c = getCtx()
  const o = out()
  if (!c || !o) return
  const t = c.currentTime
  // Woody body
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.09)
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(g).connect(o)
  osc.start(t)
  osc.stop(t + 0.15)
  // Knock transient
  noiseBurst(c, o, t, 0.05, 1400, 0.12)
}

/** Cinematic dread hit — an elimination. Impact, sub drop, and a dark tail. */
export function playKill() {
  const c = getCtx()
  const o = out()
  if (!c || !o) return
  const t = c.currentTime
  // Impact crack
  noiseBurst(c, o, t, 0.12, 500, 0.28)
  // Sub drop
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(110, t)
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.7)
  g.gain.setValueAtTime(0.55, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
  osc.connect(g).connect(o)
  osc.start(t)
  osc.stop(t + 1.15)
  // Dark minor-second drone tail
  ;[138.6, 146.8].forEach((f) => {
    const osc2 = c.createOscillator()
    const g2 = c.createGain()
    osc2.type = "sine"
    osc2.frequency.value = f
    g2.gain.setValueAtTime(0.0001, t + 0.1)
    g2.gain.exponentialRampToValueAtTime(0.07, t + 0.25)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
    osc2.connect(g2).connect(o)
    osc2.start(t + 0.1)
    osc2.stop(t + 1.45)
  })
}

/** Soft two-note chime — phase transition. */
export function playPhase(kind: "night" | "day" | "vote") {
  const c = getCtx()
  const o = out()
  if (!c || !o) return
  const t = c.currentTime
  const freqs = kind === "night" ? [196, 147] : kind === "day" ? [262, 392] : [220, 220]
  freqs.forEach((f, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = "sine"
    osc.frequency.value = f
    const start = t + i * 0.16
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(0.18, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.7)
    osc.connect(g).connect(o)
    osc.start(start)
    osc.stop(start + 0.75)
  })
}

/** Soft warm pop — a new discussion statement appears. Subtle, chat-like. */
export function playTick() {
  const c = getCtx()
  const o = out()
  if (!c || !o) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(520, t)
  osc.frequency.exponentialRampToValueAtTime(720, t + 0.06)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(g).connect(o)
  osc.start(t)
  osc.stop(t + 0.13)
}

/** Victory fanfare — game over. Rolled chord with shimmer and a sub root. */
export function playEnd(winner: "wolves" | "villagers") {
  const c = getCtx()
  const o = out()
  if (!c || !o) return
  const t = c.currentTime
  // Villagers: bright C major add9. Wolves: dark G minor.
  const chord = winner === "villagers" ? [262, 330, 392, 523, 587] : [196, 233, 294, 392, 466]
  chord.forEach((f, i) => {
    const start = t + i * 0.09
    // Main voice + slightly detuned twin for width
    ;[0, 4].forEach((detune) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = i < 2 ? "triangle" : "sine"
      osc.frequency.value = f
      osc.detune.value = detune
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(detune ? 0.05 : 0.11, start + 0.06)
      g.gain.exponentialRampToValueAtTime(0.001, start + 2.2)
      osc.connect(g).connect(o)
      osc.start(start)
      osc.stop(start + 2.3)
    })
  })
  // Sub root for weight
  const sub = c.createOscillator()
  const sg = c.createGain()
  sub.type = "sine"
  sub.frequency.value = winner === "villagers" ? 65.4 : 49
  sg.gain.setValueAtTime(0.0001, t)
  sg.gain.exponentialRampToValueAtTime(0.22, t + 0.15)
  sg.gain.exponentialRampToValueAtTime(0.001, t + 2.4)
  sub.connect(sg).connect(o)
  sub.start(t)
  sub.stop(t + 2.5)
  // Sparkle shimmer on villager win
  if (winner === "villagers") {
    ;[1047, 1319, 1568].forEach((f, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = "sine"
      osc.frequency.value = f
      const start = t + 0.5 + i * 0.14
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(0.04, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.8)
      osc.connect(g).connect(o)
      osc.start(start)
      osc.stop(start + 0.85)
    })
  }
}

/** Ambient drone loop — starts/stops the background music bed. */
export function startMusic() {
  const c = getCtx()
  const o = out()
  if (!c || !o || musicNodes) return

  const g = c.createGain()
  g.gain.value = 0.05
  g.connect(o)

  const oscA = c.createOscillator()
  oscA.type = "sine"
  oscA.frequency.value = 65.4 // C2
  const oscB = c.createOscillator()
  oscB.type = "sine"
  oscB.frequency.value = 98 // G2
  const oscC = c.createOscillator()
  oscC.type = "triangle"
  oscC.frequency.value = 130.8 // C3
  const gC = c.createGain()
  gC.gain.value = 0.3

  // Slow swell LFO for movement
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain).connect(g.gain)

  oscA.connect(g)
  oscB.connect(g)
  oscC.connect(gC).connect(g)
  oscA.start()
  oscB.start()
  oscC.start()
  lfo.start()

  musicNodes = {
    stop: () => {
      const t = c.currentTime
      g.gain.linearRampToValueAtTime(0.0001, t + 0.5)
      setTimeout(() => {
        oscA.stop()
        oscB.stop()
        oscC.stop()
        lfo.stop()
        g.disconnect()
      }, 600)
    },
  }
}

export function stopMusic() {
  if (musicNodes) {
    musicNodes.stop()
    musicNodes = null
  }
}

export function setMuted(muted: boolean) {
  getCtx()
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.6
}
