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

  // Ctrl+C while waiting on the model aborts the request instead of killing the process mid-spinner.
  // Returns undefined when aborted.
  const generate = async (opts: GenerateOptions = {}) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    process.once("SIGINT", abort);
    const spinner = ora({ text: "generating commit messages (ctrl+c to cancel)" }).start();
    try {
      return await generateCommitMessages(config, diffs, { context, ...opts, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) return undefined;
      throw error;
    } finally {
      spinner.stop();
      process.off("SIGINT", abort);
    }
  };

  let messages = await generate();
  if (!messages) {
    process.exitCode = 130;
    return console.log("cancelled");
  }

  while (true) {
    const pick = await pickCommit(messages, stat);
    if (!pick || isCancel(pick)) return;

    if (pick.action === "regenerate") {
      const feedback = await askFeedback();
      if (isCancel(feedback)) continue; // esc: back to the same suggestions
      // aborted regenerate keeps the current suggestions
      messages = (await generate({ previous: pick.message, feedback: feedback || undefined })) ?? messages;
      continue;
    }

    const output = await commitStaged(formatCommit(pick.message), pick.action === "edit");
    return output && console.log(output);
  }
}
