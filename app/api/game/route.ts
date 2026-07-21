import { NextRequest } from "next/server"
import { PLAYERS, PLAYERS_4, type GameEvent } from "@/lib/game-script"
import { runGame } from "@/lib/game-engine"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
// Allow up to 5 minutes for a full AI game on local / pro Vercel plans
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const count = parseInt(searchParams.get("players") ?? "6", 10)
  const players = count === 4 ? PLAYERS_4 : PLAYERS

  // Validate API keys up front so the client can fall back to the demo script
  if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "No API keys configured. Set GROQ_API_KEY and/or GOOGLE_GEMINI_API_KEY in .env.local" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: GameEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
        } catch {
          // controller may already be closed (client disconnected)
        }
      }

      try {
        await runGame(players, send)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        // Stream the error as a system event so the client can surface it
        try {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "system", text: `⚠ Game error: ${msg}`, d: 0 }) + "\n"
            )
          )
        } catch { /* ignore */ }
      } finally {
        try {
          controller.close()
        } catch { /* ignore */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
