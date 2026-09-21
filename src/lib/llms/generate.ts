import { Config, saveConfig } from "../config";
import keystore from "../keystore";
import { generateText, Output } from "ai";
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

/**
 * Generate multiple plausible commit messages for a diff.
 */
export type CommitMessage = z.infer<typeof conventionalCommit>;

export async function generateCommitMessages(config: Config, diffs: string) {
  const credentials = await keystore.getKeysFromKeyChain();
  if (credentials.length === 0) throw new Error(`No API keys. Run: aic key add <your-key>`);

  const lastUsedKeyIndex = config.lastUsedKeyIndex;
  const nextIndex = lastUsedKeyIndex + 1;
  const keyIndex = nextIndex >= credentials.length ? 0 : nextIndex;
  const apiCredential = credentials[keyIndex];
  const google = createGoogle({ apiKey: apiCredential.password });

  const { output } = await generateText({
    model: google(config.model),
    output: Output.object({
      schema: z.object({ messages: z.array(conventionalCommit).min(1).max(3) }),
    }),
    instructions: instructionPrompt,
    prompt: `<diff>\n${diffs}\n</diff>`,
  });

  // ensure next run, it goes to the next credential if available
  config.lastUsedKeyIndex = keyIndex;
  saveConfig(config)

  return output.messages;
}
