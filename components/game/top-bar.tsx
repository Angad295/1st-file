"use client"

import Link from "next/link"
import Image from "next/image"
import { Pause, Play, Eye, EyeOff, RotateCcw, Volume2, VolumeX } from "lucide-react"

const SPEEDS = [0.5, 1, 2, 3]

interface TopBarProps {
  phase: "night" | "day" | "vote" | null
  round: number
  aliveCount: number
  playing: boolean
  ended: boolean
  speed: number
  showThoughts: boolean
  soundOn: boolean
  onTogglePlay: () => void
  onCycleSpeed: () => void
  onToggleThoughts: () => void
  onToggleSound: () => void
  onReset: () => void
}

const PHASE_LABEL: Record<string, string> = {
  night: "Night",
  day: "Day — Discussion",
  vote: "Day — Vote",
}

export function TopBar({
  phase,
  round,
  aliveCount,
  playing,
  ended,
  speed,
  showThoughts,
  soundOn,
  onTogglePlay,
  onCycleSpeed,
  onToggleThoughts,
  onToggleSound,
  onReset,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2" aria-label="Back to home">
          <Image src="/wolf-mark.jpg" alt="" width={22} height={22} className="rounded-full" />
          <span className="hidden sm:inline text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Arena
          </span>
        </Link>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest">
          <span className={phase === "night" ? "text-seer-gold" : "text-foreground"}>
            {phase ? PHASE_LABEL[phase] : "Setup"}
          </span>
          <span className="text-muted-foreground">R{round}</span>
          <span className="text-muted-foreground tabular-nums">{aliveCount} alive</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            className={`p-2 rounded-md border transition-colors ${
              soundOn
                ? "border-seer-gold text-seer-gold bg-seer-gold/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title={soundOn ? "Mute sound" : "Enable sound"}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="sr-only">Toggle sound</span>
          </button>
          <button
            type="button"
            onClick={onToggleThoughts}
            aria-pressed={showThoughts}
            className={`p-2 rounded-md border transition-colors ${
              showThoughts
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title={showThoughts ? "Hide private reasoning" : "Show private reasoning"}
          >
            {showThoughts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="sr-only">Toggle private reasoning</span>
          </button>
          <button
            type="button"
            onClick={onCycleSpeed}
            className="px-2 py-1.5 rounded-md border border-border text-[10px] tabular-nums text-muted-foreground hover:text-foreground transition-colors"
            title="Playback speed"
          >
            {speed}x
          </button>
          {ended ? (
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
              title="Replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sr-only">Replay game</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-2 rounded-md border border-border text-foreground hover:bg-secondary transition-colors"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="sr-only">{playing ? "Pause" : "Play"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export { SPEEDS }
