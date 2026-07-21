"use client"

import { useEffect } from "react"
import type { Player } from "@/lib/game-script"
import { Crown } from "lucide-react"

interface MvpPopupProps {
  winner: "wolves" | "villagers"
  mvp: Player
  onContinue: () => void
}

export function MvpPopup({ winner, mvp, onContinue }: MvpPopupProps) {
  // Auto-advance to the full report after a few seconds
  useEffect(() => {
    const t = setTimeout(onContinue, 6000)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Best player of the game"
    >
      <div className="modal-in text-center max-w-sm w-full">
        <p className="rise text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
          {winner === "wolves" ? "The wolves feast" : "The village endures"}
        </p>
        <p
          className="rise text-[11px] tracking-[0.3em] uppercase text-seer-gold mb-8"
          style={{ animationDelay: "120ms" }}
        >
          Best player of the game
        </p>

        {/* Crown drops onto the portrait */}
        <div className="relative inline-block mb-5">
          <Crown
            className="skull-pop absolute -top-7 left-1/2 -translate-x-1/2 w-9 h-9 text-seer-gold"
            style={{ animationDelay: "500ms" }}
            aria-hidden
          />
          <div
            className="rise rounded-full p-1 border-2 border-seer-gold speaking-ring"
            style={{ animationDelay: "240ms" }}
          >
            <img
              src={mvp.avatar || "/placeholder.svg"}
              alt={mvp.name}
              className="w-28 h-28 rounded-full object-cover"
            />
          </div>
        </div>

        <h2 className="rise font-serif text-4xl font-black mb-1" style={{ animationDelay: "360ms" }}>
          {mvp.name}
        </h2>
        <p className="rise text-xs font-mono text-muted-foreground mb-8" style={{ animationDelay: "420ms" }}>
          {mvp.model}
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="rise bg-primary text-primary-foreground px-7 py-3 rounded-md text-sm font-semibold hover:bg-foreground/90 transition-colors"
          style={{ animationDelay: "500ms" }}
        >
          See full report
        </button>
        <p className="rise mt-3 text-[10px] text-muted-foreground/60" style={{ animationDelay: "560ms" }}>
          Continuing automatically…
        </p>
      </div>
    </div>
  )
}
