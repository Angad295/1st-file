"use client"

import { useEffect, useRef } from "react"
import { PLAYERS, type GameEvent } from "@/lib/game-script"

interface DiscussionFeedProps {
  events: GameEvent[]
  waiting: boolean
}

const PHASE_TITLE: Record<string, string> = {
  night: "Night falls",
  day: "The sun rises",
  vote: "The village votes",
}

export function DiscussionFeed({ events, waiting }: DiscussionFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll ONLY the feed's own container — never the page — so the
  // arena circle on the left stays fixed in place.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [events.length])

  const items = events.filter(
    (e) => e.type === "phase" || e.type === "system" || (e.type === "statement" && e.text !== "…"),
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Discussion</h2>
        {waiting && (
          <span className="flex gap-1" aria-label="agents deliberating">
            <span className="typing-dot w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="typing-dot w-1 h-1 rounded-full bg-muted-foreground" style={{ animationDelay: "0.15s" }} />
            <span className="typing-dot w-1 h-1 rounded-full bg-muted-foreground" style={{ animationDelay: "0.3s" }} />
          </span>
        )}
      </div>

      <div ref={scrollRef} className="feed-scroll flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">The arena is silent. The game begins…</p>
        )}

        {items.map((e, i) => {
          if (e.type === "phase") {
            return (
              <div key={i} className="rise flex items-center gap-3 py-1.5" role="separator">
                <span className="flex-1 h-px bg-border" aria-hidden />
                <span
                  className={`text-[9px] tracking-[0.3em] uppercase ${
                    e.phase === "vote" ? "text-accent" : "text-seer-gold"
                  }`}
                >
                  {PHASE_TITLE[e.phase]} · R{e.round}
                </span>
                <span className="flex-1 h-px bg-border" aria-hidden />
              </div>
            )
          }

          if (e.type === "system") {
            return (
              <p key={i} className="rise text-[11px] italic text-muted-foreground text-center text-pretty px-4">
                {e.text}
              </p>
            )
          }

          if (e.type === "statement") {
            const p = PLAYERS.find((pl) => pl.id === e.player)
            if (!p) return null
            return (
              <div key={i} className="rise flex gap-3 items-start">
                <img
                  src={p.avatar || "/placeholder.svg"}
                  alt=""
                  className="w-8 h-8 rounded-full border border-border object-cover shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{p.model}</span>
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90 text-pretty">{e.text}</p>
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
