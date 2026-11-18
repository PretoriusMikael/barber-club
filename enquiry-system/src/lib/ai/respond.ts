import OpenAI from "openai";
import { env } from "@/lib/env";
import { turnJsonSchema, turnSchema, type ModelTurn } from "./turn-schema";

/**
 * One model call per visitor message, via the Responses API with Structured
 * Outputs. No tools, no agent loop: the model reads, classifies and drafts a
 * reply; the server does everything with side effects. Predictable cost,
 * predictable latency, nothing the model can trigger on its own.
 */

let client: OpenAI | undefined;
function openai(): OpenAI {
  // 20s ceiling and one retry: a chat visitor will not wait longer than that,
  // and the route has a non-AI fallback for when this throws.
  client ??= new OpenAI({ apiKey: env().OPENAI_API_KEY, timeout: 20_000, maxRetries: 1 });
  return client;
}

export interface ModelInputMessage {
  role: "user" | "assistant" | "developer";
  content: string;
}

export interface ModelResult {
  turn: ModelTurn | null;
  /** Why turn is null: refusal, incomplete output, or unparseable JSON. */
  failure?: "refusal" | "incomplete" | "invalid_output";
  model: string;
  usage: { input: number; cached: number; output: number };
  latencyMs: number;
}

export async function generateTurn(args: {
  instructions: string;
  input: ModelInputMessage[];
  enquiryTypeKeys: string[];
  /** Stable per tenant: improves prompt-cache routing. */
  cacheKey: string;
  /** Hashed visitor id: lets OpenAI attribute abuse without receiving PII. */
  safetyId: string;
}): Promise<ModelResult> {
  const { OPENAI_MODEL, OPENAI_REASONING_EFFORT } = env();
  const started = Date.now();

  const response = await openai().responses.create({
    model: OPENAI_MODEL,
    instructions: args.instructions,
    input: args.input,
    text: {
      format: {
        type: "json_schema",
        name: "assistant_turn",
        strict: true,
        schema: turnJsonSchema(args.enquiryTypeKeys),
      },
    },
    ...(OPENAI_REASONING_EFFORT ? { reasoning: { effort: OPENAI_REASONING_EFFORT } } : {}),
    max_output_tokens: 1200,
    // Do not keep conversations on OpenAI's side; we store what we need.
    store: false,
    prompt_cache_key: args.cacheKey,
    safety_identifier: args.safetyId,
  });

  const result: ModelResult = {
    turn: null,
    model: response.model,
    usage: {
      input: response.usage?.input_tokens ?? 0,
      cached: response.usage?.input_tokens_details?.cached_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
    },
    latencyMs: Date.now() - started,
  };

  if (response.status === "incomplete") return { ...result, failure: "incomplete" };

  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );
  if (refused) return { ...result, failure: "refusal" };

  try {
    const parsed = turnSchema.safeParse(JSON.parse(response.output_text));
    return parsed.success ? { ...result, turn: parsed.data } : { ...result, failure: "invalid_output" };
  } catch {
    return { ...result, failure: "invalid_output" };
  }
}
