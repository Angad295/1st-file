"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { getRoster, getScript, type GameEvent } from "@/lib/game-script"
import { applyOverrides, loadOverrides, type OverrideMap } from "@/lib/agent-store"
import { TopBar, SPEEDS } from "@/components/game/top-bar"
import { ArenaCircle } from "@/components/game/arena-circle"
import { DiscussionFeed } from "@/components/game/discussion-feed"
import { VoteModal } from "@/components/game/vote-modal"
import { EndScreen } from "@/components/game/end-screen"
import { MvpPopup } from "@/components/game/mvp-popup"
import { playVote, playKill, playPhase, playTick, playEnd, startMusic, stopMusic, setMuted } from "@/lib/sfx"

export default function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ players?: string }>
}) {
  const { players } = use(searchParams)

  // Derive player count directly from URL — no extra effect needed
  const rawCount = parseInt(players || "6", 10)
  const initialCount = [4, 6].includes(rawCount) ? rawCount : 6

  const [playerCount] = useState(initialCount)
  const [overrides, setOverrides] = useState<OverrideMap>({})

  // Streaming state
  const [streamedEvents, setStreamedEvents] = useState<GameEvent[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLive, setIsLive] = useState(false) // true = real AI; false = demo fallback

  // Playback state (drives the timed reveal of events)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showThoughts, setShowThoughts] = useState(true)
  const [soundOn, setSoundOn] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [mvpDismissed, setMvpDismissed] = useState(false)
  const lastPlayedIdx = useRef(0)

  // A key that bumps when the user hits "Replay" — forces a fresh stream
  const [gameKey, setGameKey] = useState(0)

  // Load agent customizations
  useEffect(() => {
    setOverrides(loadOverrides())
  }, [])

  // ── Stream real AI game events from the API ──────────────────────────────
  useEffect(() => {
    setStreamedEvents([])
    setIdx(0)
    lastPlayedIdx.current = 0
    setPlaying(true)
    setShowVoteModal(false)
    setMvpDismissed(false)
    setIsStreaming(true)

    const controller = new AbortController()

    async function fetchStream() {
      try {
        const res = await fetch(`/api/game?players=${playerCount}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          // API not configured → fall back to hardcoded demo
          console.warn("AI game unavailable — using demo script")
          setStreamedEvents(getScript(playerCount))
          setIsLive(false)
          return
        }

        setIsLive(true)
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const event: GameEvent = JSON.parse(trimmed)
              setStreamedEvents((prev) => [...prev, event])
            } catch {
              // ignore malformed lines
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return
        // Network error → fall back to demo
        console.error("Stream error:", err)
        setStreamedEvents(getScript(playerCount))
        setIsLive(false)
      } finally {
        setIsStreaming(false)
      }
    }

    fetchStream()
    return () => controller.abort()
  }, [playerCount, gameKey])

  // ── events = buffered stream (or demo fallback) ───────────────────────────
  const events = streamedEvents

  const roster = useMemo(
    () => applyOverrides(getRoster(playerCount), overrides),
    [playerCount, overrides]
  )

  // ── Timed playback — advance idx when a new event is available ────────────
  useEffect(() => {
    if (!playing || idx >= events.length) return
    // For live games, d is set per event; for demo the original delays apply
    const delay = Math.max(200, (events[idx]?.d ?? 1200)) / speed
    const t = setTimeout(() => setIdx((i) => i + 1), delay)
    return () => clearTimeout(t)
  }, [playing, idx, speed, events])

  // ── Show vote modal on phase change ──────────────────────────────────────
  useEffect(() => {
    if (idx > 0) {
      const curr = events[idx - 1]
      if (curr?.type === "phase" && curr.phase === "vote") setShowVoteModal(true)
    }
  }, [idx, events])

  // ── SFX ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!soundOn) { lastPlayedIdx.current = idx; return }
    for (let i = lastPlayedIdx.current; i < idx; i++) {
      const e = events[i]
      if (!e) continue
      if (e.type === "vote") playVote()
      else if (e.type === "kill") playKill()
      else if (e.type === "phase") playPhase(e.phase)
      else if (e.type === "statement" && e.text !== "…") playTick()
      else if (e.type === "end") playEnd(e.winner)
    }
    lastPlayedIdx.current = idx
  }, [idx, soundOn, events])

  // ── Ambient music ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (soundOn) { setMuted(false); startMusic() }
    else { setMuted(true); stopMusic() }
    return () => stopMusic()
  }, [soundOn])

  const visible = useMemo(() => events.slice(0, idx), [idx, events])
  const currentEvent = idx > 0 ? events[idx - 1] : null

  const derived = useMemo(() => {
    const alive = new Set(roster.map((p) => p.id))
    const revealed = new Map<string, string>()
    let phase: "night" | "day" | "vote" | null = null
    let round = 0
    let end: Extract<GameEvent, { type: "end" }> | null = null

    for (const e of visible) {
      if (e.type === "phase") { phase = e.phase; round = e.round }
      else if (e.type === "kill") {
        alive.delete(e.player)
        const p = roster.find((pl) => pl.id === e.player)
        if (p) revealed.set(p.id, p.role)
      } else if (e.type === "end") {
        end = e
        for (const p of roster) revealed.set(p.id, p.role)
      }
    }
    return { alive, revealed, phase, round, end }
  }, [visible, roster])

  const reset = () => {
    setGameKey((k) => k + 1) // triggers a fresh AI stream
    setIdx(0)
    lastPlayedIdx.current = 0
    setPlaying(true)
    setShowVoteModal(false)
    setMvpDismissed(false)
  }

  // Waiting = AI is still generating AND we've caught up to what's arrived
  const waitingForAI = isStreaming && idx >= events.length && !derived.end
  const waitingPlayback = playing && idx < events.length && !derived.end
  const waiting = waitingForAI || waitingPlayback

  return (
    <div className="grain min-h-dvh lg:h-dvh lg:overflow-hidden bg-background text-foreground flex flex-col">
      <TopBar
        phase={derived.phase}
        round={derived.round}
        aliveCount={derived.alive.size}
        playing={playing}
        ended={derived.end !== null}
        speed={speed}
        showThoughts={showThoughts}
        soundOn={soundOn}
        onTogglePlay={() => setPlaying((p) => !p)}
        onCycleSpeed={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
        onToggleThoughts={() => setShowThoughts((s) => !s)}
        onToggleSound={() => setSoundOn((s) => !s)}
        onReset={reset}
      />

      {/* Live AI badge */}
      {isLive && (
        <div className="flex justify-center pt-1 pb-0 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.25em] uppercase font-semibold text-seer-gold border border-seer-gold/30 bg-seer-gold/5 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-seer-gold animate-pulse" />
            Live AI · Real models
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:w-full">
        {/* Left: circular arena */}
        <section
          aria-label="Arena seating"
          className="arena-scroll-hidden lg:w-1/2 shrink-0 flex items-center justify-center overflow-y-auto px-4 pb-4 pt-2 lg:py-4"
        >
          <ArenaCircle
            roster={roster}
            alive={derived.alive}
            revealed={derived.revealed}
            currentEvent={currentEvent}
            phase={derived.phase}
            round={derived.round}
            showThoughts={showThoughts}
          />
        </section>

        {/* Right: discussion */}
        <main className="h-[50dvh] lg:h-auto lg:flex-1 min-w-0 lg:min-h-0 border-t lg:border-t-0 lg:border-l border-border">
          <DiscussionFeed events={visible} waiting={waiting} />
        </main>
      </div>

      {/* Vote modal */}
      <VoteModal
        isOpen={showVoteModal && derived.phase === "vote"}
        events={visible}
        roster={roster}
        round={derived.round}
        onClose={() => setShowVoteModal(false)}
      />

      {/* MVP popup → full report */}
      {derived.end && !mvpDismissed && (
        <MvpPopup
          winner={derived.end.winner}
          mvp={roster.find((p) => p.id === derived.end!.mvp)!}
          onContinue={() => setMvpDismissed(true)}
        />
      )}

      {derived.end && mvpDismissed && (
        <EndScreen
          winner={derived.end.winner}
          mvp={derived.end.mvp}
          summary={derived.end.summary}
          events={visible}
          roster={roster}
          onReplay={reset}
        />
      )}
    </div>
  )
}
