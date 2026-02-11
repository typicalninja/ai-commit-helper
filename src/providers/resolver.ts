import type { Provider, GenerateResult } from "./types.ts";
import { ProviderError } from "./types.ts";
import { geminiProvider } from "./gemini.ts";
import { openaiProvider } from "./openai.ts";
import { ollamaProvider } from "./ollama.ts";
import type { Config } from "../lib/config.ts";
import * as keystore from "../lib/keystore.ts";

const providers = new Map<string, Provider>([
  ["gemini", geminiProvider],
  ["openai", openaiProvider],
  ["ollama", ollamaProvider],
]);

export function getProvider(name: string): Provider | undefined {
  return providers.get(name);
}

export function listProviders(): Provider[] {
  return [...providers.values()];
}

export function providerNames(): string[] {
  return [...providers.keys()];
}

export async function generate(
  config: Config,
  diff: string,
  context?: string,
): Promise<GenerateResult> {
  const providerName = config.provider;
  const provider = providers.get(providerName);

  if (!provider) {
    throw new ProviderError(`unknown provider: ${providerName}`);
  }

  const providerConfig = config.providers[providerName];
  const keys = await keystore.getKeys(providerName);
  const baseUrl = providerConfig?.baseUrl;
  const model = config.model || provider.defaultModel;

  if (provider.requiresKey && keys.length === 0) {
    throw new ProviderError(
      `no API keys for ${providerName}. Run: aic add-key ${providerName} <your-key>`,
    );
  }

  if (!provider.requiresKey) {
    return provider.generate(model, diff, { baseUrl }, context);
  }

  // key rotation: random start index to distribute usage
  const startIndex = Math.floor(Math.random() * keys.length);
  const errors: ProviderError[] = [];

  for (let i = 0; i < keys.length; i++) {
    const keyIndex = (startIndex + i) % keys.length;
    try {
      return await provider.generate(
        model,
        diff,
        { apiKey: keys[keyIndex], baseUrl },
        context,
      );
    } catch (error) {
      if (
        error instanceof ProviderError &&
        error.retryable &&
        i < keys.length - 1
      ) {
        errors.push(error);
        continue;
      }
      throw error;
    }
  }

  throw new ProviderError(
    `all ${keys.length} keys exhausted for ${providerName}: ${errors.map((e) => e.message).join("; ")}`,
  );
}
