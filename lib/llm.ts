/** LLM utility — routes to Groq (Llama) or Google Gemini based on model label. */

export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

// Map display labels → real API model IDs
const GROQ_MODEL_MAP: Record<string, string> = {
  "llama-3.3-70b": "llama-3.3-70b-versatile",
  "llama-3.1-8b": "llama-3.1-8b-instant",
  "deepseek-r1": "deepseek-r1-distill-llama-70b",
  "gpt-4o-mini": "llama-3.1-8b-instant",
  "claude-haiku": "llama-3.3-70b-versatile",
  "mistral-small": "llama-3.1-8b-instant",
}

const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-3-flash": "gemini-1.5-flash",
  "gemini-2-flash": "gemini-1.5-flash",
  "gemini-1.5-flash": "gemini-1.5-flash",
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Call the appropriate LLM (Groq or Gemini) and return the raw text response. */
export async function callLLM(modelLabel: string, messages: Message[]): Promise<string> {
  const isGemini = modelLabel.startsWith("gemini")
  const fn = isGemini
    ? () => callGemini(GEMINI_MODEL_MAP[modelLabel] ?? "gemini-1.5-flash", messages)
    : () => callGroq(GROQ_MODEL_MAP[modelLabel] ?? "llama-3.1-8b-instant", messages)
  return withRetry(fn)
}

async function withRetry(fn: () => Promise<string>, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isLast = attempt === retries - 1
      const msg = err instanceof Error ? err.message : String(err)
      const isRate = msg.includes("429") || msg.toLowerCase().includes("rate")
      if (isLast) throw err
      await sleep(isRate ? 4000 * (attempt + 1) : 1500)
    }
  }
  throw new Error("Max retries exceeded")
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(model: string, messages: Message[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 400,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices[0].message.content as string
}

// ── Google Gemini ─────────────────────────────────────────────────────────────

async function callGemini(model: string, messages: Message[]): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not configured")

  const systemMsg = messages.find((m) => m.role === "system")?.content ?? ""
  const userText = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n")

  const fullPrompt = systemMsg ? `${systemMsg}\n\n${userText}` : userText

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}
