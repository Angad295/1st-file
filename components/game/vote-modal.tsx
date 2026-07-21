"use client"

import { type GameEvent, type Player } from "@/lib/game-script"

interface VoteModalProps {
  isOpen: boolean
  events: GameEvent[]
  roster: Player[]
  round: number
  onClose: () => void
}

/** Extract the current vote phase data */
function getCurrentVotes(events: GameEvent[], roster: Player[]) {
  let lastVotePhase = -1
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.type === "phase" && events[i].phase === "vote") {
      lastVotePhase = i
      break
    }
  }
  if (lastVotePhase === -1) return { votes: [], eliminated: null }

  const votes: { voter: string; target: string }[] = []
  let eliminated: string | null = null
  for (let i = lastVotePhase + 1; i < events.length; i++) {
    const e = events[i]
    if (!e) break
    if (e.type === "vote") votes.push({ voter: e.voter, target: e.target })
    if (e.type === "kill" && e.cause === "vote") eliminated = e.player
    if (e.type === "phase") break
  }
  return { votes, eliminated }
}

export function VoteModal({ isOpen, events, roster, round, onClose }: VoteModalProps) {
  if (!isOpen) return null

  const { votes, eliminated } = getCurrentVotes(events, roster)
  const playerMap = new Map(roster.map((p) => [p.id, p]))
  const player = (id: string) => playerMap.get(id)

  // Build tally
  const tally = new Map<string, number>()
  for (const v of votes) tally.set(v.target, (tally.get(v.target) ?? 0) + 1)
  const maxVotes = tally.size > 0 ? Math.max(...tally.values()) : 0

  // Map each voter to their target
  const voteOf = new Map<string, string>()
  for (const v of votes) voteOf.set(v.voter, v.target)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Round ${round} voting`}
    >
      <div className="modal-in relative w-full max-w-2xl max-h-[90dvh] flex flex-col border border-border rounded-lg bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-secondary/40">
          <span className="font-serif text-2xl text-accent leading-none" aria-hidden>
            ⚖
          </span>
          <div>
            <h2 className="text-base font-bold tracking-wide">Village Vote</h2>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Round {round}</p>
          </div>
          {votes.length < roster.length && (
            <span className="ml-auto mr-8 flex items-center gap-1.5 text-[10px] text-seer-gold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-seer-gold blink" aria-hidden />
              voting live
            </span>
          )}
        </header>

        {/* Main content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1 min-h-0 overflow-y-auto">
          {/* Left: voter cards showing who voted for whom */}
          <div className="space-y-3">
            <h3 className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">Each vote</h3>
            <ul className="space-y-2.5">
              {votes.map((v, idx) => {
                const voter = player(v.voter)
                const target = player(v.target)
                if (!voter || !target) return null
                const isEliminated = eliminated === voter.id

                return (
                  <li
                    key={`${v.voter}-${idx}`}
                    className={`vote-slide flex items-center gap-2.5 rounded-md border px-3 py-2.5 ${
                      isEliminated ? "border-accent bg-accent/10 shake" : "border-border/60 bg-secondary/50"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Voter avatar */}
                    <img
                      src={voter.avatar || "/placeholder.svg"}
                      alt={voter.name}
                      className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                    />

                    {/* Voter name and model */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight truncate">{voter.name}</p>
                      <p className="text-[8px] font-mono text-muted-foreground truncate">{voter.model}</p>
                    </div>

                    {/* Arrow */}
                    <span className="text-muted-foreground text-xs shrink-0" aria-hidden>
                      →
                    </span>

                    {/* Target avatar */}
                    <img
                      src={target.avatar || "/placeholder.svg"}
                      alt={target.name}
                      className="w-7 h-7 rounded-full border border-accent/60 object-cover shrink-0"
                    />

                    {/* Target name */}
                    <p className="text-xs font-semibold text-accent truncate shrink-0">{target.name}</p>

                    {isEliminated && (
                      <span className="ml-auto text-accent text-xs shrink-0">
                        <span className="skull-pop" role="img" aria-label="eliminated">
                          ☠
                        </span>
                      </span>
                    )}
                  </li>
                )
              })}

              {/* Players still deciding */}
              {votes.length < roster.length && (
                <li className="text-[10px] text-muted-foreground italic opacity-60 py-1.5">
                  {roster.length - votes.length} {roster.length - votes.length === 1 ? "agent" : "agents"} deciding...
                </li>
              )}
            </ul>
          </div>

          {/* Right: tally bars */}
          <div className="space-y-3">
            <h3 className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">Vote tally</h3>
            {tally.size > 0 ? (
              <div className="space-y-2.5">
                {[...tally.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([targetId, count]) => {
                    const target = player(targetId)
                    if (!target) return null
                    const isOut = eliminated === targetId

                    return (
                      <div key={targetId} className={isOut ? "shake" : ""}>
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={target.avatar || "/placeholder.svg"}
                            alt={target.name}
                            className="w-6 h-6 rounded-full border border-border object-cover shrink-0"
                          />
                          <span className="flex-1 text-xs font-semibold truncate">{target.name}</span>
                          <span className={`text-xs font-mono font-semibold ${isOut ? "text-accent" : "text-seer-gold"}`}>
                            {count}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`tally-grow h-full rounded-full ${isOut ? "bg-accent" : "bg-seer-gold/70"}`}
                            style={{ width: `${(count / Math.max(maxVotes, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic opacity-60">Votes incoming...</p>
            )}
          </div>
        </div>

        {/* Footer */}
        {eliminated && (
          <footer className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent font-serif text-lg">☠</span>
              <p className="text-sm font-semibold">
                <span className="text-accent">{player(eliminated)?.name}</span>
                <span className="text-muted-foreground font-normal"> has been eliminated.</span>
              </p>
            </div>
          </footer>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close voting display"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
