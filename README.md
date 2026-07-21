# AI Werewolf Arena

A live multi-agent social deduction arena powered by real AI models. Six (or four) AI agents play Werewolf in real time — every statement, private thought, night action, and vote is generated on the fly by free-tier LLMs from Groq and Google Gemini.

## Overview

| Area | Details |
| --- | --- |
| Game type | Werewolf / social deduction |
| Modes | 4 agents or 6 agents |
| AI backend | Groq (Llama) + Google Gemini — free-tier APIs |
| Fallback | Built-in demo script if no API keys are set |
| Customization | Agent name, model, and avatar saved in localStorage |
| Audio | Optional synthesized sound effects and ambient music |

## How It Works

When you click **Begin the Hunt**, the game page opens a streaming connection to `/api/game`. The server-side game engine runs the full Werewolf loop — night, day, vote — calling real LLMs for every agent action. Events stream to the browser as NDJSON and are replayed at a controlled pace in the UI.

```
Browser ──fetch──▶ /api/game?players=6
         ◀──NDJSON── GameEvent stream
```

Each agent receives a system prompt describing their role, private knowledge (wolf partners, seer results, doctor logs), and the full public chat history. They respond with JSON: `{ thought, speech }` or `{ thought, vote }`.

If no API keys are configured the app falls back to a pre-written demo script so the UI always works.

## Agent Roles

| Role | Count (6p) | Count (4p) | Ability |
| --- | --- | --- | --- |
| Werewolf | 2 | 1 | Kill one villager per night |
| Seer | 1 | 1 | Investigate one player per night |
| Doctor | 1 | 1 | Protect one player per night |
| Villager | 2 | 1 | Discuss and vote |

## Default Roster

| Agent | Model (display) | Real API model | Provider |
| --- | --- | --- | --- |
| Moreau | llama-3.3-70b | llama-3.3-70b-versatile | Groq |
| Ilsa | gemini-1.5-flash | gemini-1.5-flash | Google |
| Quill | llama-3.3-70b | llama-3.3-70b-versatile | Groq |
| Barrow | gemini-1.5-flash | gemini-1.5-flash | Google |
| Tansy | llama-3.1-8b | llama-3.1-8b-instant | Groq |
| Fenwick | llama-3.1-8b | llama-3.1-8b-instant | Groq |

Agents can also be set to **`deepseek-r1`** in the agent editor → routes to `deepseek-r1-distill-llama-70b` on Groq (free tier, same `GROQ_API_KEY`).

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm

### Installation

```bash
pnpm install
```

### API Keys (required for live AI games)

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

```env
# Groq — free at https://console.groq.com/keys
# Powers: llama-3.3-70b · llama-3.1-8b · deepseek-r1 (all on one key)
GROQ_API_KEY=gsk_...

# Google Gemini — free at https://aistudio.google.com/app/apikey
# Powers: gemini-1.5-flash
GOOGLE_GEMINI_API_KEY=AIza...
```

Both are **free with no credit card required**.

| Provider | Models covered | Free tier limits |
| --- | --- | --- |
| Groq | llama-3.3-70b, llama-3.1-8b, **deepseek-r1** | ~14,400 tokens/min, 30 req/min per model |
| Google Gemini | gemini-1.5-flash | 15 req/min, 1 M tokens/day |

> **DeepSeek-R1 on Groq** — `deepseek-r1` routes to `deepseek-r1-distill-llama-70b`, a Llama-70B model distilled with DeepSeek-R1 reasoning. No separate DeepSeek API key is needed — it runs on your existing `GROQ_API_KEY`.

A full 6-agent game makes roughly 25–35 LLM calls total, well within free limits.

### Development

```bash
pnpm dev
```

Open `http://localhost:3000`

If you see the **"⚡ Live AI · Real models"** badge on the game screen, real AI is running. Without keys the badge is absent and the demo script plays.

### Production Build

```bash
pnpm build
pnpm start
```

> **Note:** Vercel Hobby plan has a 10-second function timeout. A full AI game takes 2–5 minutes. Deploy to Vercel Pro/Enterprise or a self-hosted server for live games.

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16 |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Components | Radix UI primitives |
| Icons | lucide-react |
| Analytics | Vercel Analytics |
| Package manager | pnpm |
| AI — Llama | Groq API (OpenAI-compatible, JSON mode) |
| AI — Gemini | Google Generative AI REST API |

## Project Structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Home screen — game config, agent roster, API setup guide |
| `app/game/page.tsx` | Game screen — streams events, drives timed playback |
| `app/api/game/route.ts` | Streaming NDJSON endpoint — runs the AI game engine |
| `lib/game-engine.ts` | Full game orchestrator (night, day, vote loop) |
| `lib/llm.ts` | LLM router — Groq + Gemini with retry/backoff |
| `lib/game-script.ts` | Rosters, roles, and fallback demo events |
| `lib/agent-store.ts` | localStorage helpers for agent customization |
| `lib/sfx.ts` | Web Audio sound effects and ambient music |
| `components/game/` | Arena circle, discussion feed, vote modal, end screen |
| `components/agent-editor.tsx` | Agent customization modal |
| `public/avatars/` | Agent portrait images |
| `.env.local` | Your API keys (git-ignored) |
| `.env.local.example` | Key template to copy |

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run ESLint |
| `pnpm approve-builds` | Approve native dependency build scripts (first install only) |

## Notes

- `next.config.mjs` ignores TypeScript build errors and uses unoptimized images — safe to remove these flags before production.
- Agent customizations (name, model, avatar) are saved in `localStorage` and carry into the live game. The chosen model label must be one of the supported options in `lib/agent-store.ts`.
- The game engine has a hard cap of 5 rounds to prevent runaway API usage.
- LLM calls use JSON mode (`response_format: { type: "json_object" }` on Groq, `responseMimeType: "application/json"` on Gemini). Malformed responses fall back to safe defaults.

## License

No license has been specified yet. Add a license before publishing or accepting external contributions.
