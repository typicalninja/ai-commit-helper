import { Config, saveConfig } from "../config";
import keystore from "../keystore";
import { APICallError, generateText, Output } from "ai";
import { createGoogle } from "@ai-sdk/google";
import z from "zod/v4";
import { instructionPrompt } from "./instructions";

const conventionalCommit = z.object({
  type: z.enum(["feat", "fix", "refactor", "perf", "style", "test", "docs", "build", "chore"]),
  scope: z.string().optional(),
  breaking_change: z.boolean().default(false),
  description: z.string(),
  body: z.string().optional(),
  footer: z.string().optional(),
});

export type CommitMessage = z.infer<typeof conventionalCommit>;

export type GenerateOptions = {
  /** free-form notes from the user about the change */
  context?: string;
  /** a suggestion the user wants redone, and optional instructions for the redo */
  previous?: CommitMessage;
  feedback?: string;
  signal?: AbortSignal;
};

/**
 * Generate multiple plausible commit messages for a diff.
 */
export async function generateCommitMessages(config: Config, diffs: string, opts: GenerateOptions = {}) {
  const credentials = await keystore.getKeysFromKeyChain();
  if (credentials.length === 0) throw new Error(`No API keys. Run: aic key add <your-key>`);

  const prompt = [
    `<diff>\n${diffs}\n</diff>`,
    opts.context && `<context>\n${opts.context}\n</context>`,
    opts.previous && `<previous>\n${JSON.stringify(opts.previous)}\n</previous>`,
    opts.feedback && `<feedback>\n${opts.feedback}\n</feedback>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // start after the last used key, then walk the rest if a key is rate limited or rejected
  const start = (config.lastUsedKeyIndex + 1) % credentials.length;
  let lastError: unknown;
  for (let attempt = 0; attempt < credentials.length; attempt++) {
    const keyIndex = (start + attempt) % credentials.length;
    const google = createGoogle({ apiKey: credentials[keyIndex].password });
    try {
      const { output } = await generateText({
        model: google(config.model),
        output: Output.object({
          schema: z.object({ messages: z.array(conventionalCommit).min(1).max(3) }),
        }),
        instructions: instructionPrompt,
        prompt,
        abortSignal: opts.signal,
        // backing off on a rate limited key defeats switching to the next one
        maxRetries: credentials.length > 1 ? 0 : 2,
      });

      // ensure next run, it goes to the next credential if available
      config.lastUsedKeyIndex = keyIndex;
      await saveConfig(config);
      return output.messages;
    } catch (error) {
      if (!isKeyError(error)) throw error;
      lastError = error;
    }
  }
  throw new Error(
    `all ${credentials.length} API key(s) failed: ${lastError instanceof Error ? lastError.message : lastError}`,
  );
}

// rate limit, bad or disabled key. Google reports an invalid key as 400 "API key not valid".
function isKeyError(error: unknown) {
  if (!APICallError.isInstance(error)) return false;
  const { statusCode } = error;
  return statusCode === 429 || statusCode === 401 || statusCode === 403 || (statusCode === 400 && /api key/i.test(error.message));
}
