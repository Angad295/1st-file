"use client"

import { PLAYERS, type GameEvent } from "@/lib/game-script"

interface VotingBoardProps {
  events: GameEvent[]
}

/** Extracts the votes belonging to the most recent vote phase, plus the result. */
function currentVoteRound(events: GameEvent[]) {
  let lastVotePhase = -1
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === "phase" && e.phase === "vote") {
      lastVotePhase = i
      break
    }
  }
  if (lastVotePhase === -1) return null

  const votes: { voter: string; target: string }[] = []
  let eliminated: string | null = null
  for (let i = lastVotePhase + 1; i < events.length; i++) {
    const e = events[i]
    if (e.type === "vote") votes.push({ voter: e.voter, target: e.target })
    if (e.type === "kill" && e.cause === "vote") eliminated = e.player
    if (e.type === "phase") break
  }
  const round = (events[lastVotePhase] as Extract<GameEvent, { type: "phase" }>).round
  return { votes, eliminated, round }
}

export function VotingBoard({ events }: VotingBoardProps) {
  const data = currentVoteRound(events)
  if (!data || data.votes.length === 0) return null

  const { votes, eliminated, round } = data

  // Tally per target
  const tally = new Map<string, number>()
  for (const v of votes) tally.set(v.target, (tally.get(v.target) ?? 0) + 1)
  const maxVotes = Math.max(...tally.values())
  const targets = [...tally.entries()].sort((a, b) => b[1] - a[1])

  const player = (id: string) => PLAYERS.find((p) => p.id === id)

  return (
    <section
      aria-label={`Round ${round} voting`}
      className="rise border-t border-border bg-card/60 backdrop-blur-sm shrink-0"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2.5 flex items-center gap-2">
          <span className="text-accent" aria-hidden>
            ⚖
          </span>
          Live vote · Round {round}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Individual votes: voter → target */}
          <ul className="flex flex-wrap gap-1.5 sm:max-w-[55%]">
            {votes.map((v, i) => {
              const voter = player(v.voter)
              const target = player(v.target)
              if (!voter || !target) return null
              return (
                <li
                  key={`${v.voter}-${i}`}
                  className="vote-slide flex items-center gap-1.5 border border-border rounded-full bg-secondary/60 pl-1 pr-2.5 py-1"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <img
                    src={voter.avatar || "/placeholder.svg"}
                    alt={voter.name}
                    className="w-5 h-5 rounded-full border border-border object-cover"
                  />
                  <span className="text-[10px] text-muted-foreground" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">votes against</span>
                  <span className="text-[11px] font-semibold text-accent">{target.name}</span>
                </li>
              )
            })}
          </ul>

          {/* Tally bars */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {targets.map(([targetId, count]) => {
              const target = player(targetId)
              if (!target) return null
              const isEliminated = eliminated === targetId
              return (
                <div key={targetId} className={`flex items-center gap-2 ${isEliminated ? "shake" : ""}`}>
                  <span className="w-16 shrink-0 text-[11px] font-semibold truncate">
                    {target.name}
                    {isEliminated && (
                      <span className="ml-1 text-accent text-[9px] uppercase tracking-wider">out</span>
                    )}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`tally-grow h-full rounded-full ${isEliminated ? "bg-accent" : "bg-seer-gold/70"}`}
                      style={{ width: `${(count / Math.max(maxVotes, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-[11px] font-mono text-muted-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
