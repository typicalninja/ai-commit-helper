import { isCancel } from "@clack/core";
import ora from "ora";
import { loadConfig } from "../lib/config";
import { commitStaged, getStagedDiffs, getStagedStat } from "../lib/git";
import { generateCommitMessages, type GenerateOptions } from "../lib/llms/generate";
import { askFeedback, formatCommit, pickCommit } from "../lib/ui/suggestions";

export default async function generateCommandAction(context?: string) {
  const config = await loadConfig();
  const diffs = await getStagedDiffs();
  if (!diffs.trim()) throw new Error("no staged changes. Stage files first: git add <files>");

  const stat = await getStagedStat();

  const generate = async (opts: GenerateOptions = {}) => {
    const spinner = ora("generating commit messages").start();
    return generateCommitMessages(config, diffs, { context, ...opts }).finally(() => spinner.stop());
  };

  let messages = await generate();
  while (true) {
    const pick = await pickCommit(messages, stat);
    if (!pick || isCancel(pick)) return;

    if (pick.action === "regenerate") {
      const feedback = await askFeedback();
      if (isCancel(feedback)) continue; // esc: back to the same suggestions
      messages = await generate({ previous: pick.message, feedback: feedback || undefined });
      continue;
    }

    const output = await commitStaged(formatCommit(pick.message), pick.action === "edit");
    return output && console.log(output);
  }
}
