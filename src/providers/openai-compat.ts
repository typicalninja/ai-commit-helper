import { buildPrompt } from "../lib/prompt.ts";
import {
  type Provider,
  type ProviderOptions,
  type GenerateResult,
  ProviderError,
} from "./types.ts";

interface ChatCompletion {
  choices: Array<{ message: { content: string | null } }>;
}

async function callOpenAICompat(
  baseUrl: string,
  model: string,
  diff: string,
  apiKey?: string,
  context?: string,
): Promise<GenerateResult> {
  const prompt = buildPrompt(diff, context);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ProviderError(
      `${response.status} ${response.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
      response.status,
      response.status === 429 || response.status >= 500,
    );
  }

  const data = (await response.json()) as ChatCompletion;
  const message = data.choices[0]?.message?.content?.trim();

  if (!message) {
    throw new ProviderError("empty response from API");
  }

  return { message };
}

export function createOpenAICompatProvider(config: {
  name: string;
  defaultModel: string;
  requiresKey: boolean;
  defaultBaseUrl: string;
}): Provider {
  return {
    name: config.name,
    defaultModel: config.defaultModel,
    requiresKey: config.requiresKey,
    async generate(
      model: string,
      diff: string,
      options: ProviderOptions,
      context?: string,
    ): Promise<GenerateResult> {
      const baseUrl = options.baseUrl ?? config.defaultBaseUrl;
      return callOpenAICompat(
        baseUrl,
        model,
        diff,
        options.apiKey,
        context,
      );
    },
  };
}
