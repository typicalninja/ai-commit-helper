import { isCancel } from "@clack/core";
import ora from "ora";
import { loadConfig } from "../lib/config";
import { commitStaged, getStagedDiffs } from "../lib/git";
import { generateCommitMessages } from "../lib/llms/generate";
import { formatCommit, pickCommit } from "../lib/ui/suggestions";

export default async function generateCommandAction(_context?: string) {
  const config = await loadConfig();
  const diffs = await getStagedDiffs();
  if (!diffs.trim()) throw new Error("no staged changes. Stage files first: git add <files>");

  while (true) {
    const spinner = ora("generating commit messages").start();
    const messages = await generateCommitMessages(config, diffs).finally(() => spinner.stop());
    const pick = await pickCommit(messages);
    if (!pick || isCancel(pick)) return;
    if (pick.action !== "regenerate") {
      const output = await commitStaged(formatCommit(pick.message), pick.action === "edit");
      return output && console.log(output);
    }
  }
}
