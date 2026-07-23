import type { Player } from "./game-script";

export interface AgentOverride {
  name?: string;
  model?: string;
  avatar?: string;
  custom?: boolean;
}

export type OverrideMap = Record<string, AgentOverride>;

const KEY = "arena-agent-overrides";

/** Models that are actually wired to free-tier APIs (Groq / Gemini). */
export const MODEL_OPTIONS = [
  // ── Groq (free tier) ──────────────────────────────────────────
  "gpt-oss-120b", // → openai/gpt-oss-120b  (fastest, smartest)
  "gpt-oss-20b", // → openai/gpt-oss-20b    (fastest, lightest)
  "qwen3.6-27b", // → qwen/qwen3.6-27b      (reasoning model)
  // ── Google Gemini (free tier) ─────────────────────────────────
  "gemini-3.5-flash", // → gemini-3.5-flash      (multimodal, balanced)
];

/** Human-readable provider label shown next to the model id in the UI. */
export const MODEL_PROVIDER: Record<string, string> = {
  "gpt-oss-120b": "Groq",
  "gpt-oss-20b": "Groq",
  "qwen3.6-27b": "Groq · Qwen",
  "gemini-3.5-flash": "Gemini",
};

export const AVATAR_OPTIONS = [
  "/avatars/moreau.png",
  "/avatars/ilsa.png",
  "/avatars/quill.png",
  "/avatars/barrow.png",
  "/avatars/tansy.png",
  "/avatars/fenwick.png",
];

export function loadOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveOverride(id: string, override: AgentOverride) {
  const all = loadOverrides();
  all[id] = { ...all[id], ...override };
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearOverride(id: string) {
  const all = loadOverrides();
  delete all[id];
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function applyOverrides(
  players: Player[],
  overrides: OverrideMap,
): Player[] {
  return players.map((p) => {
    const ov = overrides[p.id];
    if (!ov) return p;
    return {
      ...p,
      name: ov.name?.trim() || p.name,
      model: ov.model || p.model,
      avatar: ov.avatar || p.avatar,
    };
  });
}
