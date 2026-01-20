import configManager from "../lib/config-manager";
import { isInGitRepository } from "../lib/git";
import { providerManager } from "../lib/provider-manager";
import { cyan, dim, red, yellow } from "yoctocolors";
import { getStagedDiffs } from "../lib/git";
import confirm from "@inquirer/confirm";

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

  // generate commit message
  const finalCommitMessage = await provider.generateCommitMessage(stagedDiffs, userContext);

  // menu to show generated commit message and options
  let exitMenu = false;

  while (!exitMenu) {
    console.log(`> ${finalCommitMessage}`)
    
  }
}
