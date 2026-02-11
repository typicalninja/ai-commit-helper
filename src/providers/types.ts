export interface GenerateResult {
  message: string;
}

export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface Provider {
  readonly name: string;
  readonly defaultModel: string;
  readonly requiresKey: boolean;
  generate(
    model: string,
    diff: string,
    options: ProviderOptions,
    context?: string,
  ): Promise<GenerateResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function extractHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as Record<string, unknown>;
  for (const key of ["status", "statusCode", "httpStatusCode"]) {
    const v = e[key];
    if (typeof v === "number" && v >= 400 && v < 600) return v;
  }
  return undefined;
}
