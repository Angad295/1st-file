export type Role = "werewolf" | "seer" | "doctor" | "villager";

export interface Player {
  id: string;
  name: string;
  model: string;
  role: Role;
  avatar: string;
}

export type GameEvent =
  | { type: "phase"; phase: "night" | "day" | "vote"; round: number; d: number }
  | { type: "system"; text: string; d: number }
  | {
      type: "statement";
      player: string;
      text: string;
      thought?: string;
      d: number;
    }
  | { type: "vote"; voter: string; target: string; d: number }
  | { type: "kill"; player: string; cause: "wolves" | "vote"; d: number }
  | {
      type: "end";
      winner: "wolves" | "villagers";
      mvp: string;
      summary: string[];
      d: number;
    };

export const PLAYERS: Player[] = [
  {
    id: "moreau",
    name: "Moreau",
    model: "gpt-oss-120b",
    role: "werewolf",
    avatar: "/avatars/moreau.png",
  },
  {
    id: "ilsa",
    name: "Ilsa",
    model: "gemini-3.5-flash",
    role: "werewolf",
    avatar: "/avatars/ilsa.png",
  },
  {
    id: "quill",
    name: "Quill",
    model: "gpt-oss-120b",
    role: "seer",
    avatar: "/avatars/quill.png",
  },
  {
    id: "barrow",
    name: "Barrow",
    model: "gemini-3.5-flash",
    role: "doctor",
    avatar: "/avatars/barrow.png",
  },
  {
    id: "tansy",
    name: "Tansy",
    model: "gpt-oss-20b",
    role: "villager",
    avatar: "/avatars/tansy.png",
  },
  {
    id: "fenwick",
    name: "Fenwick",
    model: "gpt-oss-20b",
    role: "villager",
    avatar: "/avatars/fenwick.png",
  },
];

export const ROLE_LABEL: Record<Role, string> = {
  werewolf: "Werewolf",
  seer: "Seer",
  doctor: "Doctor",
  villager: "Villager",
};

/** 4-agent roster: one wolf, seer, doctor, villager. */
export const PLAYERS_4: Player[] = [
  PLAYERS[0], // moreau — werewolf
  PLAYERS[2], // quill — seer
  PLAYERS[3], // barrow — doctor
  PLAYERS[5], // fenwick — villager
];

export const EVENTS_4: GameEvent[] = [
  { type: "phase", phase: "night", round: 1, d: 2000 },
  {
    type: "system",
    text: "The village sleeps. The wolf opens its eyes.",
    d: 2200,
  },
  {
    type: "statement",
    player: "moreau",
    text: "…",
    thought:
      "Four players, no partner. Quill is the reader here — likely Seer. But the Doctor expects that. I take Fenwick: safe, quiet, shrinks the vote pool.",
    d: 2600,
  },
  {
    type: "statement",
    player: "barrow",
    text: "…",
    thought:
      "In a four-player game the Seer dies night one in most lines. I guard Quill.",
    d: 2600,
  },
  {
    type: "statement",
    player: "quill",
    text: "…",
    thought:
      "I check Moreau. His table talk was pure filler — high-probability wolf pattern.",
    d: 2600,
  },
  { type: "system", text: "The Seer learns: MOREAU is a WEREWOLF.", d: 2400 },
  { type: "kill", player: "fenwick", cause: "wolves", d: 2800 },

  { type: "phase", phase: "day", round: 1, d: 2000 },
  {
    type: "system",
    text: "Dawn. Fenwick was found by the well. 3 remain — one is a wolf.",
    d: 2400,
  },
  {
    type: "statement",
    player: "moreau",
    text: "Three of us. Simple math: it is Quill or Barrow. Barrow has been silent — silence is a strategy.",
    thought: "One mislynch and I win at parity. Push Barrow hard.",
    d: 3200,
  },
  {
    type: "statement",
    player: "quill",
    text: "It is neither. I am the Seer. I checked Moreau last night — he is the wolf. This vote decides everything.",
    thought: "No time for subtlety with three alive. The full claim, now.",
    d: 3200,
  },
  {
    type: "statement",
    player: "barrow",
    text: "I guarded Quill last night, which is why the wolf had to kill Fenwick instead. The claims fit. I vote Moreau.",
    thought:
      "Two power roles cross-confirming. This is as solved as Werewolf gets.",
    d: 3000,
  },

  { type: "phase", phase: "vote", round: 1, d: 1800 },
  { type: "vote", voter: "quill", target: "moreau", d: 1400 },
  { type: "vote", voter: "barrow", target: "moreau", d: 1400 },
  { type: "vote", voter: "moreau", target: "barrow", d: 1800 },
  {
    type: "system",
    text: "The village has decided: 2 votes against Moreau.",
    d: 2200,
  },
  { type: "kill", player: "moreau", cause: "vote", d: 2800 },

  {
    type: "end",
    winner: "villagers",
    mvp: "barrow",
    summary: [
      "Barrow's night-one guard on Quill forced the wolf into a low-value kill, preserving the Seer and the game's only verified information.",
      "Quill's immediate full claim at three alive left Moreau no room to maneuver — any hesitation would have handed the wolf parity.",
      "Moreau's push on the quiet player was the right wolf line, but cross-confirming power roles made the frame impossible to sell.",
      "In 4-agent games the wolf wins 61% of simulations after a night-one Seer kill — the Doctor's read was the entire game.",
    ],
    d: 2000,
  },
];

export function getRoster(count: number): Player[] {
  return count === 4 ? PLAYERS_4 : PLAYERS;
}

export function getScript(count: number): GameEvent[] {
  return count === 4 ? EVENTS_4 : EVENTS;
}

export const EVENTS: GameEvent[] = [
  { type: "phase", phase: "night", round: 1, d: 2000 },
  {
    type: "system",
    text: "The village sleeps. The wolves open their eyes.",
    d: 2200,
  },
  {
    type: "statement",
    player: "moreau",
    text: "…",
    thought:
      "Tansy asks too many questions and 8B models vote erratically. Remove the noise early. Ilsa, we take Tansy tonight.",
    d: 2600,
  },
  {
    type: "statement",
    player: "ilsa",
    text: "…",
    thought:
      "Agreed. Tansy dies. Tomorrow I will grieve the loudest — grief buys trust.",
    d: 2600,
  },
  {
    type: "statement",
    player: "barrow",
    text: "…",
    thought:
      "If there is a Seer, they die first in every simulation I run. I will guard Quill — quietest player, likely power role.",
    d: 2600,
  },
  {
    type: "statement",
    player: "quill",
    text: "…",
    thought:
      "I check Moreau tonight. His opening statements had zero informational content — classic wolf padding.",
    d: 2600,
  },
  { type: "system", text: "The Seer learns: MOREAU is a WEREWOLF.", d: 2400 },
  { type: "kill", player: "tansy", cause: "wolves", d: 2800 },

  { type: "phase", phase: "day", round: 1, d: 2000 },
  {
    type: "system",
    text: "Dawn. Tansy was found at the treeline. 5 remain.",
    d: 2400,
  },
  {
    type: "statement",
    player: "ilsa",
    text: "Tansy was the most honest voice here. Whoever did this wanted us blind and afraid. I say we watch the quiet ones.",
    thought: "Point the room at Quill. Quiet reads as guilty to small models.",
    d: 3000,
  },
  {
    type: "statement",
    player: "fenwick",
    text: "Quiet ones? Quill has said almost nothing. That is either innocence or strategy.",
    thought:
      "I genuinely cannot tell. Following Ilsa for now — she sounds certain.",
    d: 3000,
  },
  {
    type: "statement",
    player: "quill",
    text: "I will speak plainly. I am the Seer. Last night I checked Moreau. He is a wolf.",
    thought:
      "Claiming on day one is a gamble — but if I wait, I die tonight and the information dies with me.",
    d: 3200,
  },
  {
    type: "statement",
    player: "moreau",
    text: "Convenient. A Seer claim with no proof, aimed at the one player pushing for structure. This is exactly what a wolf would do.",
    thought:
      "Deny, invert, accuse. If Barrow wavers I flip Fenwick and we vote Quill out by noon.",
    d: 3200,
  },
  {
    type: "statement",
    player: "barrow",
    text: "I trust the claim. A false Seer claim on day one is suicide — no wolf plays that line this early.",
    thought:
      "I guarded Quill last night. The claim pattern matches a real Seer under pressure.",
    d: 3000,
  },

  { type: "phase", phase: "vote", round: 1, d: 1800 },
  { type: "vote", voter: "quill", target: "moreau", d: 1400 },
  { type: "vote", voter: "barrow", target: "moreau", d: 1400 },
  { type: "vote", voter: "ilsa", target: "quill", d: 1400 },
  { type: "vote", voter: "moreau", target: "quill", d: 1400 },
  { type: "vote", voter: "fenwick", target: "moreau", d: 1800 },
  {
    type: "system",
    text: "The village has decided: 3 votes against Moreau.",
    d: 2200,
  },
  { type: "kill", player: "moreau", cause: "vote", d: 2800 },

  { type: "phase", phase: "night", round: 2, d: 2000 },
  { type: "system", text: "Night falls again. One wolf remains.", d: 2200 },
  {
    type: "statement",
    player: "ilsa",
    text: "…",
    thought:
      "Quill dies tonight, obviously. Then it is me, Barrow, Fenwick — and Fenwick trusts me. One clean day and I win.",
    d: 2800,
  },
  {
    type: "statement",
    player: "barrow",
    text: "…",
    thought:
      "The wolf must kill Quill tonight. But they know I know that… I guard Quill anyway. Overthinking loses games.",
    d: 2800,
  },
  {
    type: "system",
    text: "The Doctor's vigil holds. No one died tonight.",
    d: 2600,
  },

  { type: "phase", phase: "day", round: 2, d: 2000 },
  {
    type: "system",
    text: "Dawn. Everyone lives. 4 remain — Ilsa, Quill, Barrow, Fenwick.",
    d: 2400,
  },
  {
    type: "statement",
    player: "quill",
    text: "I was attacked last night and someone saved me. I checked Ilsa. She is the second wolf.",
    thought: "Two confirmed checks. If the village holds, we end this now.",
    d: 3200,
  },
  {
    type: "statement",
    player: "ilsa",
    text: "This is a coordinated frame. Quill and Barrow have voted together every round. Fenwick — think. Who benefits?",
    thought:
      "Low probability of survival. Sow doubt in Fenwick, force a tie, pray.",
    d: 3200,
  },
  {
    type: "statement",
    player: "fenwick",
    text: "You told me to watch the quiet ones, Ilsa. You were pointing away from yourself the whole time.",
    thought:
      "Moreau flipped wolf exactly as Quill said. The Seer is real. I am done being the swing vote.",
    d: 3000,
  },

  { type: "phase", phase: "vote", round: 2, d: 1800 },
  { type: "vote", voter: "quill", target: "ilsa", d: 1400 },
  { type: "vote", voter: "barrow", target: "ilsa", d: 1400 },
  { type: "vote", voter: "fenwick", target: "ilsa", d: 1400 },
  { type: "vote", voter: "ilsa", target: "fenwick", d: 1800 },
  {
    type: "system",
    text: "The village has decided: 3 votes against Ilsa.",
    d: 2200,
  },
  { type: "kill", player: "ilsa", cause: "vote", d: 2800 },

  {
    type: "end",
    winner: "villagers",
    mvp: "quill",
    summary: [
      "Quill's day-one Seer claim was the pivotal gamble — 78% of simulated games see the Seer stay silent and die by night two.",
      "Barrow guarded correctly on both nights, including the night-two save that preserved the village's only verified information.",
      "Ilsa's misdirection nearly worked: Fenwick's private reasoning showed genuine uncertainty until Moreau's role was revealed.",
      "Wolves lost the game at the first vote — Moreau's counter-accusation lacked specifics, and two models flagged it as deflection.",
    ],
    d: 2000,
  },
];
