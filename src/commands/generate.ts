import readline from "node:readline";
import { loadConfig } from "../lib/config.ts";
import {
  isGitRepo,
  getStagedFileStats,
  getStagedDiff,
  commit,
} from "../lib/git.ts";
import { generate } from "../providers/resolver.ts";
import { ProviderError } from "../providers/types.ts";
import { selectFiles } from "../ui/files.ts";
import { commitBox, error, warn } from "../ui/format.ts";
import { editor } from "@inquirer/prompts";
import ora from "ora";
import { dim, bold } from "yoctocolors";

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function truncateDiff(diff: string, maxLines: number): string {
  const lines = diff.split("\n");
  if (lines.length <= maxLines) return diff;
  return (
    lines.slice(0, maxLines).join("\n") +
    `\n[truncated: ${lines.length - maxLines} lines omitted]`
  );
}

export default async function runGenerateCommand(context: string[]) {
  try {
    await run(context);
  } catch (err) {
    if ((err as Error).name === "ExitPromptError") return;
    console.error(error((err as Error).message));
    process.exitCode = 1;
  }
}

async function run(context: string[]) {
  const userContext = context.join(" ") || undefined;

  if (!(await isGitRepo())) {
    console.error(error("not a git repository"));
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig();
  const files = await getStagedFileStats();

  if (files.length === 0) {
    console.error(
      error("no staged changes. Stage files with: git add <files>"),
    );
    process.exitCode = 1;
    return;
  }

  const selectedFiles = await selectFiles(files, config.ignore);

  if (selectedFiles.length === 0) {
    console.error(error("no files selected"));
    process.exitCode = 1;
    return;
  }

  let diff = await getStagedDiff(selectedFiles);
  diff = truncateDiff(diff, config.maxDiffLines);

  if (!diff.trim()) {
    console.error(error("staged diff is empty"));
    process.exitCode = 1;
    return;
  }

  const diffLines = diff.split("\n").length;
  console.log(
    dim(
      `\n${selectedFiles.length} file(s), ~${diffLines} diff lines -> ${config.provider}/${config.model}\n`,
    ),
  );

  let commitMessage = await generateMessage(config, diff, userContext);
  if (!commitMessage) return;

  let done = false;
  while (!done) {
    console.log(commitBox(commitMessage));

    const action = await ask(
      `${dim("[c]ommit  [e]dit  [r]egenerate  [q]uit")} ${bold("?")} `,
    );

    switch (action) {
      case "c":
      case "commit":
        try {
          await commit(commitMessage);
          done = true;
        } catch (err) {
          console.error(error(`commit failed: ${(err as Error).message}`));
          console.log(warn("fix the issue and try again"));
        }
        break;

      case "e":
      case "edit": {
        const edited = await editor({
          message: "Edit commit message",
          default: commitMessage,
        });
        if (edited.trim()) commitMessage = edited.trim();
        break;
      }

      case "r":
      case "regenerate": {
        const msg = await generateMessage(config, diff, userContext);
        if (msg) commitMessage = msg;
        break;
      }

      case "q":
      case "quit":
        done = true;
        break;

      default:
        break;
    }
  }
}

async function generateMessage(
  config: Parameters<typeof generate>[0],
  diff: string,
  context?: string,
): Promise<string | null> {
  const spinner = ora("generating...").start();

  try {
    const result = await generate(config, diff, context);
    spinner.succeed("done");
    return result.message;
  } catch (err) {
    spinner.fail("failed");
    if (err instanceof ProviderError) {
      console.error(error(err.message));
      if (err.status === 429) {
        console.error(
          warn("rate limited. Add more keys with: aic add-key <provider> <key>"),
        );
      }
    } else {
      console.error(error((err as Error).message));
    }
    process.exitCode = 1;
    return null;
  }
}
