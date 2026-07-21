"use client"

import Link from "next/link"
import { ROLE_LABEL, type GameEvent, type Role, type Player } from "@/lib/game-script"
import { Crown, RotateCcw, Home, Skull, Shield } from "lucide-react"

interface EndScreenProps {
  winner: "wolves" | "villagers"
  mvp: string
  summary: string[]
  events: GameEvent[]
  roster: Player[]
  onReplay: () => void
}

const ROLE_COLOR: Record<Role, string> = {
  werewolf: "text-accent",
  seer: "text-seer-gold",
  doctor: "text-seer-gold",
  villager: "text-muted-foreground",
}

export function EndScreen({ winner, mvp, summary, events, roster, onReplay }: EndScreenProps) {
  const mvpPlayer = roster.find((p) => p.id === mvp)
  const player = (id: string) => roster.find((p) => p.id === id)

  // Fate of each player
  const fate = new Map<string, string>()
  for (const e of events) {
    if (e.type === "kill") {
      fate.set(e.player, e.cause === "wolves" ? "Killed at night" : "Voted out")
    }
  }

  // Vote history grouped by round
  const voteRounds: { round: number; votes: { voter: string; target: string }[]; eliminated: string | null }[] = []
  let current: (typeof voteRounds)[number] | null = null
  for (const e of events) {
    if (e.type === "phase" && e.phase === "vote") {
      current = { round: e.round, votes: [], eliminated: null }
      voteRounds.push(current)
    } else if (e.type === "vote" && current) {
      current.votes.push({ voter: e.voter, target: e.target })
    } else if (e.type === "kill" && e.cause === "vote" && current) {
      current.eliminated = e.player
    }
  }

  const wolvesWon = winner === "wolves"

  return (
    <div className="fixed inset-0 z-50 bg-background/97 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full max-w-4xl mx-auto px-5 py-10">
        {/* ===== Hero band: result + MVP side by side ===== */}
        <header
          className={`rise rounded-xl border p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6 ${
            wolvesWon ? "border-accent/40 bg-accent/5" : "border-seer-gold/40 bg-seer-gold/5"
          }`}
        >
          <div className="flex-1 text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-2 text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
              {wolvesWon ? <Skull className="w-3.5 h-3.5 text-accent" /> : <Shield className="w-3.5 h-3.5 text-seer-gold" />}
              Game over
            </p>
            <h2
              className={`font-serif text-3xl sm:text-4xl md:text-5xl font-black text-balance leading-tight ${
                wolvesWon ? "text-accent" : "text-seer-gold"
              }`}
            >
              {wolvesWon ? "The Wolves Feast." : "The Village Endures."}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground max-w-sm text-pretty">
              {wolvesWon
                ? "Deception outran deduction. The village never found the last wolf."
                : "The village found every wolf before the pack could reach parity."}
            </p>
          </div>

          {mvpPlayer && (
            <div className="shrink-0 flex flex-col items-center text-center">
              <div className="relative mb-2">
                <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-seer-gold" aria-hidden />
                <img
                  src={mvpPlayer.avatar || "/placeholder.svg"}
                  alt=""
                  className="w-20 h-20 rounded-full border-2 border-seer-gold object-cover"
                />
              </div>
              <p className="text-[9px] tracking-[0.25em] uppercase text-seer-gold mb-0.5">Best player</p>
              <p className="text-sm font-bold">{mvpPlayer.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{mvpPlayer.model}</p>
            </div>
          )}
        </header>

        {/* ===== Two-column body on desktop ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Left: player outcomes */}
          <section aria-label="Player outcomes" className="rise lg:col-span-3" style={{ animationDelay: "160ms" }}>
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">How everyone fared</h3>
            <ul className="flex flex-col gap-2">
              {roster.map((p) => {
                const dead = fate.has(p.id)
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 border rounded-lg bg-card px-3 py-2.5 ${
                      p.id === mvp ? "border-seer-gold/60" : "border-border"
                    }`}
                  >
                    <img
                      src={p.avatar || "/placeholder.svg"}
                      alt=""
                      className={`w-10 h-10 rounded-full border border-border object-cover shrink-0 ${
                        dead ? "grayscale opacity-70" : ""
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                        {p.name}
                        {p.id === mvp && <Crown className="w-3.5 h-3.5 text-seer-gold" aria-label="Best player" />}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">{p.model}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[10px] uppercase tracking-wider font-semibold ${ROLE_COLOR[p.role]}`}>
                        {ROLE_LABEL[p.role]}
                      </p>
                      <p className={`text-[10px] ${dead ? "text-accent" : "text-seer-gold"}`}>
                        {fate.get(p.id) ?? "Survived"}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Right: vote history */}
          <section aria-label="Vote history" className="rise lg:col-span-2" style={{ animationDelay: "240ms" }}>
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Vote history</h3>
            <div className="flex flex-col gap-3">
              {voteRounds.map((vr) => (
                <div key={vr.round} className="border border-border rounded-lg bg-card p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    Round {vr.round}
                    {vr.eliminated && (
                      <span className="text-accent normal-case tracking-normal">
                        {" "}
                        — {player(vr.eliminated)?.name} out
                      </span>
                    )}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {vr.votes.map((v, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px]">
                        <img
                          src={player(v.voter)?.avatar || "/placeholder.svg"}
                          alt=""
                          className="w-5 h-5 rounded-full border border-border object-cover"
                        />
                        <span className="font-medium">{player(v.voter)?.name}</span>
                        <span className="text-muted-foreground flex-1 border-b border-dashed border-border/60" aria-hidden />
                        <span className="sr-only">voted against</span>
                        <span className={v.target === vr.eliminated ? "text-accent font-semibold" : "text-muted-foreground"}>
                          {player(v.target)?.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===== Analyst notes full width ===== */}
        <section aria-label="Analyst notes" className="rise mb-10" style={{ animationDelay: "320ms" }}>
          <h3 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Why it played out this way
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {summary.map((s, i) => (
              <div key={i} className="flex gap-3 border border-border rounded-lg bg-card px-4 py-3">
                <span className="font-serif text-seer-gold text-lg font-bold shrink-0 leading-snug">{i + 1}</span>
                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{s}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Actions ===== */}
        <div className="rise flex items-center justify-center gap-3 pb-4" style={{ animationDelay: "400ms" }}>
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            Replay Game
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-3.5 h-3.5" aria-hidden />
            New Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
