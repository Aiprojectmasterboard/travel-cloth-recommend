/**
 * openaiChat.ts
 *
 * OpenAI Responses API wrapper for GPT-5.4.
 * Used by capsuleAgent, styleAgent, vibeAgent, and generateOutfitItems.
 *
 * API: POST https://api.openai.com/v1/responses
 * Model: gpt-5.4 (reasoning model)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputMessage {
  role: 'developer' | 'user';
  content: Array<{ type: 'input_text'; text: string }>;
}

interface OutputItem {
  type: string;
  role?: string;
  content?: Array<{
    type: string;
    text?: string;
  }>;
}

interface OpenAIResponsesResponse {
  id: string;
  output: OutputItem[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-5.4';

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Calls OpenAI Responses API with GPT-5.4.
 * Uses developer role for system instructions (per Responses API spec).
 * Returns the assistant's text response.
 */
export async function chatCompletion(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number; // kept for interface compat; not sent to reasoning models
    reasoningEffort?: 'low' | 'medium' | 'high';
  },
): Promise<string> {
  const input: InputMessage[] = [
    { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
    { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
  ];

  const body: Record<string, unknown> = {
    model: MODEL,
    input,
    reasoning: {
      effort: options?.reasoningEffort ?? 'low',
      summary: 'auto',
    },
    text: {
      format: { type: 'text' },
    },
    store: false,
  };

  if (options?.maxTokens) {
    body.max_output_tokens = options.maxTokens;
  }

  const res = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Responses API HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIResponsesResponse;

  if (data.error) {
    throw new Error(`OpenAI Responses API error: ${data.error.message}`);
  }

  // Extract text from output — find the message with output_text
  const content = data.output
    ?.filter(item => item.type === 'message')
    ?.flatMap(item => item.content ?? [])
    ?.find(c => c.type === 'output_text')
    ?.text;

  if (!content) {
    throw new Error('OpenAI Responses API returned no text content');
  }

  if (data.usage) {
    console.log(`[openaiChat] GPT-5.4 tokens: ${data.usage.input_tokens} in / ${data.usage.output_tokens} out`);
  }

  return content;
}

/**
 * Calls OpenAI Responses API with json_object output format for reliable JSON.
 * Uses json_object mode so the model is guaranteed to return valid JSON.
 */
export async function chatCompletionJSON<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    reasoningEffort?: 'low' | 'medium' | 'high';
  },
): Promise<T> {
  const input: InputMessage[] = [
    { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
    { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
  ];

  const body: Record<string, unknown> = {
    model: MODEL,
    input,
    reasoning: {
      effort: options?.reasoningEffort ?? 'low',
      summary: 'auto',
    },
    text: {
      format: { type: 'json_object' },
    },
    store: false,
  };

  if (options?.maxTokens) {
    body.max_output_tokens = options.maxTokens;
  }

  const res = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // 2 min — JSON responses can be large
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Responses API HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIResponsesResponse;

  if (data.error) {
    throw new Error(`OpenAI Responses API error: ${data.error.message}`);
  }

  const content = data.output
    ?.filter(item => item.type === 'message')
    ?.flatMap(item => item.content ?? [])
    ?.find(c => c.type === 'output_text')
    ?.text;

  if (!content) {
    throw new Error('OpenAI Responses API returned no text content (JSON mode)');
  }

  if (data.usage) {
    console.log(`[openaiChat] GPT-5.4 JSON tokens: ${data.usage.input_tokens} in / ${data.usage.output_tokens} out`);
  }

  // json_object mode guarantees valid JSON, but strip fences just in case
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned) as T;
}
