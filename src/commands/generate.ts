import configManager from "../lib/config-manager";
import { commitStaged, isInGitRepository } from "../lib/git";
import { providerManager } from "../lib/provider-manager";
import { bgGray, cyan, dim, red, yellow } from "yoctocolors";
import { getStagedDiffs } from "../lib/git";
import confirm from "@inquirer/confirm";
import input from "@inquirer/input";
import { edit } from "@inquirer/external-editor";
import ora from "ora";

export default async function runGenerateCommand(contextOpt: string[]) {
  const userContext = contextOpt.join(" ");
  const isGitRepo = await isInGitRepository();

  if (!isGitRepo) {
    console.log(
      `${red("error:")} Current directory is not a git repository. Please run this command inside a git repository.`,
    );
    return;
  }

  const stagedDiffs = await getStagedDiffs();

  const model = configManager.get("provider.model");
  const provider = await providerManager.getPreparedProvider(model);

  if (!provider) {
    console.log(
      `${red("error:")} No provider found for model ${cyan(model)}. Please check your configuration. [key: provider.model]`,
    );
    return;
  }

  // check if there are staged diffs
    if (stagedDiffs.trim().length === 0) {
        console.log(`${red("Error:")} No staged changes found. Please stage your changes before generating a commit message.`);
        return;
    }

  // check if staged diffs exceed token limit
  const stringTokenWarnLimit = provider.stringTokenWarnLimit;
  if (stagedDiffs.length > stringTokenWarnLimit) {
    console.log(`${yellow("Warning:")} The staged diff size exceeds the recommended limit of ${stringTokenWarnLimit} characters. [staged diff size: ${stagedDiffs.length} characters]
Expect potential lower quality commit messages or failures.
If possible, consider staging smaller changes for better performance.\n`);
    const proceed = await confirm({
      message: "Do you want to proceed anyway?",
      default: false,
    });
    if (!proceed) {
      console.log("Aborting commit message generation.");
      return;
    }
  }

  const spinner = ora("Generating commit message...").start();

  // generate commit message
  let commitMessage = await provider.generateCommitMessage(
    stagedDiffs,
    userContext,
  );
  spinner.stop();
  spinner.clear();

  // menu to show generated commit message and options
  let exitMenu = false;
  let invalidInput = false;

  while (!exitMenu) {
    console.clear();

    if (invalidInput) {
      console.log(`${red("Invalid input. Please try again.")}\n`);
      invalidInput = false;
    }

    console.log(`> ${commitMessage}`);

    console.log(`\n${bgGray(" COMMANDS ")} [c]ommit / [e]dit / [q]uit\n`);
    const next = await input({
      message: "Next",
    });

    switch (next.toLowerCase()) {
      case "c":
      case "commit":
        await commitStaged(commitMessage);
        exitMenu = true;
        break;

      case "e":
      case "edit":
        // open editor to edit commit message
        const edited = edit(commitMessage);
        if (edited.trim().length === 0) {
          console.log(red("Aborting: Commit message cannot be empty."));
        } else {
          commitMessage = edited.trim();
        }
        break;

      // quit the program
      case "q":
      case "quit":
        exitMenu = true;
        break;
      default:
        invalidInput = true;
        break;
    }
  }

  console.log("Done.");
}
