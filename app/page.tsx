"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getRoster } from "@/lib/game-script"
import { HeaderBanner } from "@/components/game/header-banner"
import { AgentEditor } from "@/components/agent-editor"
import { applyOverrides, loadOverrides, type OverrideMap } from "@/lib/agent-store"
import { Pencil, UserPlus } from "lucide-react"

export default function Home() {
  const [playerCount, setPlayerCount] = useState(6)
  const [overrides, setOverrides] = useState<OverrideMap>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setOverrides(loadOverrides())
  }, [])

  const roster = applyOverrides(getRoster(playerCount), overrides)

  // "Add custom agent" targets the first seat that hasn't been customized yet
  const nextUncustomized = roster.find((p) => !overrides[p.id])

  return (
    <div className="grain min-h-screen bg-background text-foreground flex flex-col">
      <HeaderBanner size="lg" />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">
        <p className="text-[11px] tracking-[0.35em] uppercase text-accent mb-4 rise" style={{ animationDelay: "80ms" }}>
          A multi-agent social deduction arena
        </p>

        <h2
          className="font-serif text-3xl md:text-5xl lg:text-6xl font-medium leading-[1.02] text-balance mb-6 rise"
          style={{ animationDelay: "160ms" }}
        >
          {playerCount === 6 ? "Six machines." : "Four machines."}
          <br />
          {playerCount === 6 ? "Two are " : "One is "}
          <em className="text-accent not-italic font-black">lying</em>.
        </h2>

        <p
          className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty mb-10 rise"
          style={{ animationDelay: "240ms" }}
        >
          Watch AI agents play Werewolf in real time. Read what they say aloud — and what they privately think — as
          they deceive, deduce, and vote each other out.
        </p>

        {/* Game configuration */}
        <div
          className="w-full max-w-md border border-border bg-card rounded-lg p-4 mb-8 text-left rise"
          style={{ animationDelay: "320ms" }}
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">Game configuration</p>

          {/* Player count selector */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <span className="text-xs text-muted-foreground">Players</span>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Number of agents">
              {[4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={playerCount === n}
                  onClick={() => setPlayerCount(n)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    playerCount === n
                      ? "border-seer-gold text-seer-gold bg-seer-gold/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n} agents
                </button>
              ))}
            </div>
          </div>

          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Wolves hidden among them</dt>
              <dd className="text-accent font-semibold tabular-nums">{playerCount === 6 ? "2" : "1"}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Groq models</dt>
              <dd className="font-mono text-[10px] text-right">llama-3.3-70b · llama-3.1-8b · deepseek-r1</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Gemini model</dt>
              <dd className="font-mono text-[10px] text-right">gemini-1.5-flash</dd>
            </div>
          </dl>
        </div>


        <Link
          href={`/game?players=${playerCount}`}
          className="rise inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm font-semibold tracking-wide hover:bg-foreground/90 transition-colors"
          style={{ animationDelay: "440ms" }}
        >
          Begin the Hunt
          <span aria-hidden>→</span>
        </Link>

        {/* Roster with customization */}
        <div className="mt-14 w-full max-w-md rise" style={{ animationDelay: "480ms" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Tonight&apos;s players</p>
            {nextUncustomized && (
              <button
                type="button"
                onClick={() => setEditingId(nextUncustomized.id)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-seer-gold border border-seer-gold/40 rounded-md px-2.5 py-1.5 hover:bg-seer-gold/10 transition-colors"
              >
                <UserPlus className="w-3 h-3" aria-hidden />
                Add custom agent
              </button>
            )}
          </div>
          <ul className={`grid gap-2 ${playerCount === 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
            {roster.map((p) => (
              <li
                key={p.id}
                className={`group relative border rounded-md px-2 py-3 flex flex-col items-center gap-1.5 bg-card ${
                  overrides[p.id] ? "border-seer-gold/50" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label={`Customize ${p.name}`}
                >
                  <Pencil className="w-3 h-3" aria-hidden />
                </button>
                {overrides[p.id] && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] uppercase tracking-wider text-seer-gold">
                    custom
                  </span>
                )}
                <img
                  src={p.avatar || "/placeholder.svg"}
                  alt={p.name}
                  className="w-12 h-12 rounded-full border border-border object-cover"
                />
                <span className="text-xs font-semibold truncate w-full text-center">{p.name}</span>
                <span className="text-[9px] text-muted-foreground font-mono truncate w-full text-center">
                  {p.model}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground/70">
            Customizations carry into the arena, voting, and final report.
          </p>
        </div>
      </main>

      {editingId && (
        <AgentEditor
          player={roster.find((p) => p.id === editingId)!}
          isCustomized={!!overrides[editingId]}
          onSave={() => {
            setOverrides(loadOverrides())
            setEditingId(null)
          }}
          onClose={() => setEditingId(null)}
        />
      )}

      <footer className="px-5 py-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span>AI Werewolf Arena</span>
        <span>Groq · Gemini · Free-tier APIs</span>
      </footer>
    </div>
  )
}
