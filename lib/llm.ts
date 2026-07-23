/** LLM utility — routes to Groq (Llama) or Google Gemini based on model label. */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Map display labels → real API model IDs
// Groq deprecated llama-3.3-70b-versatile and llama-3.1-8b-instant on 08/16/26
// (shutdown announced 06/17/26); deepseek-r1-distill-llama-70b has been fully
// shut down since 10/02/25. See https://console.groq.com/docs/deprecations
// Labels below match MODEL_OPTIONS in lib/agent-store.ts. The old labels are
// kept as aliases so any agent already saved (via localStorage) under a
// pre-migration name still resolves instead of silently downgrading.
const GROQ_MODEL_MAP: Record<string, string> = {
  "gpt-oss-120b": "openai/gpt-oss-120b",
  "gpt-oss-20b": "openai/gpt-oss-20b",
  "qwen3.6-27b": "qwen/qwen3.6-27b",
  // legacy aliases (pre-08/16/26 deprecation)
  "llama-3.3-70b": "openai/gpt-oss-120b",
  "llama-3.1-8b": "openai/gpt-oss-20b",
  "deepseek-r1": "qwen/qwen3.6-27b",
  "gpt-4o-mini": "openai/gpt-oss-20b",
  "claude-haiku": "openai/gpt-oss-120b",
  "mistral-small": "openai/gpt-oss-20b",
};

// gemini-1.5-flash has been fully retired (no longer even listed on Google's
// deprecations page). gemini-3.5-flash is the current GA flash-tier model
// with no shutdown date announced. See https://ai.google.dev/gemini-api/docs/deprecations
const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-3.5-flash": "gemini-3.5-flash",
  // legacy aliases
  "gemini-3-flash": "gemini-3.5-flash",
  "gemini-2-flash": "gemini-3.5-flash",
  "gemini-1.5-flash": "gemini-3.5-flash",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Call the appropriate LLM (Groq or Gemini) and return the raw text response. */
export async function callLLM(
  modelLabel: string,
  messages: Message[],
): Promise<string> {
  const isGemini = modelLabel.startsWith("gemini");
  const primary = isGemini
    ? () =>
        callGemini(GEMINI_MODEL_MAP[modelLabel] ?? "gemini-3.5-flash", messages)
    : () =>
        callGroq(GROQ_MODEL_MAP[modelLabel] ?? "openai/gpt-oss-20b", messages);

  try {
    return await withRetry(primary);
  } catch (primaryErr) {
    // Primary provider exhausted its retries (e.g. rate-limited). Fail over
    // to the other provider instead of letting this bubble up and abort the
    // whole game — see PRD §10, "free-tier rate limits hit mid-game."
    const fallback = isGemini
      ? () => callGroq("openai/gpt-oss-20b", messages)
      : () => callGemini("gemini-3.5-flash", messages);
    try {
      const result = await withRetry(fallback, 2);
      console.warn(
        `[llm] ${isGemini ? "Gemini" : "Groq"} failed for "${modelLabel}", fell back to ${isGemini ? "Groq" : "Gemini"}:`,
        primaryErr instanceof Error ? primaryErr.message : primaryErr,
      );
      return result;
    } catch {
      // Both providers failed — surface the original error so if the game
      // does have to end, the message points at the real root cause.
      throw primaryErr;
    }
  }
}

async function withRetry(
  fn: () => Promise<string>,
  retries = 3,
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isLast = attempt === retries - 1;
      const msg = err instanceof Error ? err.message : String(err);
      const isRate = msg.includes("429") || msg.toLowerCase().includes("rate");
      if (isLast) throw err;
      await sleep(isRate ? 4000 * (attempt + 1) : 1500);
    }
  }
  throw new Error("Max retries exceeded");
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(model: string, messages: Message[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  // openai/gpt-oss-120b and openai/gpt-oss-20b are reasoning models: they
  // spend completion tokens on hidden chain-of-thought before writing the
  // actual JSON answer, and that reasoning counts against max_tokens. At the
  // old max_tokens: 400 (fine for the non-reasoning models this code used to
  // call), medium-effort reasoning could consume the whole budget and leave
  // an empty completion, which Groq's JSON-mode validation then rejects with
  // a 400 json_validate_failed. "low" effort keeps some reasoning while
  // leaving headroom for the answer; max_tokens is bumped as a safety margin
  // regardless. qwen/qwen3.6-27b doesn't accept low/medium/high (only
  // none/default), so it's left alone — it's meant to be the more
  // deliberate "reasoning" agent anyway.
  const isGptOss = model.startsWith("openai/gpt-oss");

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
      max_tokens: 1200,
      ...(isGptOss ? { reasoning_effort: "low" } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ── Google Gemini ─────────────────────────────────────────────────────────────

async function callGemini(model: string, messages: Message[]): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userText = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n");

  const fullPrompt = systemMsg ? `${systemMsg}\n\n${userText}` : userText;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}
