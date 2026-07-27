// Every contender runs through OpenRouter: one API key, one OpenAI-compatible
// endpoint, every model on the list. The alternative was five provider
// accounts and two code paths (the Anthropic SDK plus an OpenAI-compatible
// fetch for the rest) — not worth it for a joke benchmark.
//
// The key is read from OPENROUTER_API_KEY and never written to disk.
//
// `id` is what lands in benchmarks.json, so it must match the `models` array
// there. `model` is OpenRouter's slug — verify each against
// https://openrouter.ai/models, or run `npm run benchmarks -- --list-models`
// to search the live catalogue. Slugs change as versions ship.
// Each family's current flagship, pinned rather than aliased to `~*-latest`
// so a re-run months from now still means the same thing as the answers
// already on the board. Default (non-thinking) slugs throughout — the
// `-thinking` and `-pro` variants are a separate axis, not run here.
export const CONTENDERS = [
  { id: "opus-5", name: "Claude Opus 5", color: "#ffd8a8", model: "anthropic/claude-opus-5" },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", color: "#bac8ff", model: "google/gemini-3.1-pro-preview" },
  // The GPT-5.6 line splits into three named variants (luna / sol / terra)
  // rather than a version ladder, so "newest" doesn't pick one. Swap the
  // slug if terra turns out not to be the general-purpose flagship.
  { id: "gpt-5-6-terra", name: "GPT-5.6 Terra", color: "#b2f2bb", model: "openai/gpt-5.6-terra" },
  { id: "qwen3-7-max", name: "Qwen3.7 Max", color: "#eebefa", model: "qwen/qwen3.7-max" },
  { id: "kimi-k3", name: "Kimi K3", color: "#ffec99", model: "moonshotai/kimi-k3" },
];

const BASE_URL = "https://openrouter.ai/api/v1";
const MAX_TOKENS = 4000;

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set — export it and re-run.");
  }
  return key;
}

/**
 * One fresh single-turn conversation: no system prompt, no history, no
 * sampling overrides. Running each prompt cold is the whole methodology —
 * in one shared conversation a model notices the pattern and starts
 * performing, which makes the answers useless to compare.
 */
export async function runPrompt(contender, prompt) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: contender.model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  // OpenRouter returns upstream provider failures as a 200 with an `error`
  // key rather than an HTTP error, so a bad model slug looks like success.
  if (data.error) {
    throw new Error(`${data.error.message ?? JSON.stringify(data.error)}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(`no content in response: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return text;
}

/** Search OpenRouter's live catalogue — for checking slugs in CONTENDERS. */
export async function listModels(query = "") {
  const response = await fetch(`${BASE_URL}/models`);
  if (!response.ok) throw new Error(`HTTP ${response.status} listing models`);
  const { data } = await response.json();
  const needle = query.toLowerCase();
  return data
    .map((m) => m.id)
    .filter((id) => id.toLowerCase().includes(needle))
    .sort();
}
