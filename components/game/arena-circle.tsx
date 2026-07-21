"use client"

import { useEffect, useState } from "react"
import { ROLE_LABEL, type GameEvent, type Player } from "@/lib/game-script"

interface ArenaCircleProps {
  roster: Player[]
  alive: Set<string>
  revealed: Map<string, string>
  currentEvent: GameEvent | null
  phase: "night" | "day" | "vote" | null
  round: number
  showThoughts: boolean
}

const PHASE_ICON: Record<string, string> = {
  night: "☾",
  day: "☀",
  vote: "⚖",
}

const PHASE_LABEL: Record<string, string> = {
  night: "Night",
  day: "Day",
  vote: "Vote",
}

/** Reveals text character by character, like the model is typing its thought. */
function useTypewriter(text: string, cps = 30) {
  const [len, setLen] = useState(0)

  useEffect(() => {
    setLen(0)
  }, [text])

  useEffect(() => {
    if (len >= text.length) return
    const t = setTimeout(() => setLen((l) => l + 1), 1000 / cps)
    return () => clearTimeout(t)
  }, [len, text, cps])

  return { typed: text.slice(0, len), done: len >= text.length }
}

export function ArenaCircle({ roster, alive, revealed, currentEvent, phase, round, showThoughts }: ArenaCircleProps) {
  const players = roster
  const n = players.length

  const speakerId = currentEvent?.type === "statement" ? currentEvent.player : null
  const speaker = speakerId ? players.find((p) => p.id === speakerId) : null
  const speakerIndex = speaker ? players.indexOf(speaker) : -1
  const speakerAlive = speaker ? alive.has(speaker.id) : false

  const bubbleThought =
    currentEvent?.type === "statement" && showThoughts && currentEvent.thought ? currentEvent.thought : null
  const bubbleStatement = currentEvent?.type === "statement" && currentEvent.text !== "…" ? currentEvent.text : null

  // Seat position math shared by seats, bubble, and the pointer line
  const seatPos = (i: number) => {
    const angle = (i * (360 / n) - 90) * (Math.PI / 180)
    return { x: 50 + 41 * Math.cos(angle), y: 50 + 41 * Math.sin(angle) }
  }

  const showBubble = !!(speaker && speakerIndex >= 0 && speakerAlive && (bubbleThought || bubbleStatement))
  const speakerSeat = speakerIndex >= 0 ? seatPos(speakerIndex) : null

  // Bubble center: pulled from the speaker's seat toward the circle center,
  // so each model's bubble grows out of its own card and points back at it.
  const bubblePos = speakerSeat
    ? {
        x: 50 + (speakerSeat.x - 50) * 0.22,
        y: 50 + (speakerSeat.y - 50) * 0.22,
      }
    : null

  return (
    <div className="w-full max-w-[460px] mx-auto select-none">
      <div className="relative w-full aspect-square">
        {/* Ritual circle */}
        <div className="absolute inset-[12%] rounded-full border border-border/60" aria-hidden />
        <div className="absolute inset-[13.5%] rounded-full thinking-border opacity-40" aria-hidden />

        {/* Center phase medallion — hidden while a bubble occupies the middle */}
        {!showBubble && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden={phase === null}>
            <div className="flex flex-col items-center gap-1 text-center">
              <span
                className={`font-serif text-3xl leading-none ${phase === "vote" ? "text-accent" : "text-seer-gold"}`}
                aria-hidden
              >
                {phase ? PHASE_ICON[phase] : "☾"}
              </span>
              {phase && (
                <>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    {PHASE_LABEL[phase]}
                  </span>
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">Round {round}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pointer: connects the speaker's card to its own bubble */}
        {showBubble && speakerSeat && bubblePos && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1={bubblePos.x}
              y1={bubblePos.y}
              x2={speakerSeat.x}
              y2={speakerSeat.y}
              stroke={bubbleThought ? "oklch(0.5 0.19 27)" : "oklch(0.76 0.1 85)"}
              strokeWidth="0.6"
              strokeDasharray="2 2"
              className="bubble-in"
            />
            {/* Anchor dot on the model card */}
            <circle
              cx={speakerSeat.x}
              cy={speakerSeat.y}
              r="1.4"
              fill={bubbleThought ? "oklch(0.5 0.19 27)" : "oklch(0.76 0.1 85)"}
            />
          </svg>
        )}

        {/* Reasoning bubble — anchored near its model, pointer runs to the card */}
        {showBubble && bubblePos && speaker && (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2 w-[72%] max-w-[250px]"
            style={{ left: `${bubblePos.x}%`, top: `${bubblePos.y}%` }}
          >
            <ReasoningBubble
              key={`${speaker.id}-${bubbleThought ?? bubbleStatement}`}
              speaker={speaker}
              thought={bubbleThought}
              statement={bubbleStatement}
            />
          </div>
        )}

        {/* Seats */}
        {players.map((p, i) => {
          const { x, y } = seatPos(i)
          const isAlive = alive.has(p.id)
          const isSpeaking = speakerId === p.id && isAlive
          const role = revealed.get(p.id)

          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`relative flex flex-col items-center ${!isAlive ? "eliminated" : ""}`}>
                <div
                  className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${
                    isSpeaking
                      ? "border-seer-gold speaking-ring"
                      : role === "werewolf"
                        ? "border-accent"
                        : "border-border"
                  } bg-secondary`}
                >
                  <img src={p.avatar || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                </div>

                {/* Red skull + stamped banner on elimination */}
                {!isAlive && (
                  <>
                    <span
                      className="skull-pop skull-pulse absolute inset-0 flex items-center justify-center z-10 text-2xl"
                      role="img"
                      aria-label={`${p.name} eliminated`}
                    >
                      <span className="text-accent">☠</span>
                    </span>
                    <span
                      className="stamp-in absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 border-2 border-accent text-accent text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-sm bg-background/80 whitespace-nowrap"
                      aria-hidden
                    >
                      Eliminated
                    </span>
                  </>
                )}

                <p className="mt-1.5 text-[11px] sm:text-xs font-semibold leading-none">{p.name}</p>
                <p className="mt-0.5 text-[8px] sm:text-[9px] text-muted-foreground font-mono leading-none">
                  {p.model}
                </p>
                {role && (
                  <p
                    className={`mt-0.5 text-[8px] uppercase tracking-[0.2em] leading-none ${
                      role === "werewolf"
                        ? "text-accent"
                        : role === "seer"
                          ? "text-seer-gold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {ROLE_LABEL[role as keyof typeof ROLE_LABEL]}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReasoningBubble({
  speaker,
  thought,
  statement,
}: {
  speaker: Player
  thought: string | null
  statement: string | null
}) {
  const text = thought ?? statement ?? ""
  const { typed, done } = useTypewriter(text, 24)

  return (
    <div className="bubble-in">
      <div
        className={`thinking-border rounded-lg bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-xl border ${
          thought ? "border-accent/40" : "border-seer-gold/40"
        }`}
      >
        {/* Who is reasoning — avatar + name, unambiguous */}
        <div className="flex items-center gap-1.5 mb-1">
          <img
            src={speaker.avatar || "/placeholder.svg"}
            alt=""
            className="w-4 h-4 rounded-full border border-border object-cover"
          />
          <span className="text-[10px] font-semibold">{speaker.name}</span>
          <span
            className={`ml-auto text-[8px] tracking-[0.2em] uppercase ${thought ? "text-accent" : "text-seer-gold"}`}
          >
            {thought ? "reasoning" : "speaking"}
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] leading-relaxed text-foreground/85 text-pretty max-h-[7em] overflow-hidden">
          {typed}
          {!done && <span className="blink inline-block w-[1px] h-[1em] align-middle bg-foreground/70 ml-px" />}
        </p>
      </div>
    </div>
  )
}
