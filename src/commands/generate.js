import { intro, log, confirm, text, spinner, isCancel } from "@clack/prompts";
import { getCommitMessage } from "../util/gemini.js";
import {
  hasGitInstalled,
  inGitRepository,
  previousGitCommitMessages,
  getStaged,
  commitStaged,
  getBranchName,
} from "../util/git.js";
import { outro } from "@clack/prompts";

export default async function generateCommand(options) {
  intro("Generating Commit Message...");
  const hasGit = await hasGitInstalled();
  if (!hasGit) {
    log.error(
      "Git is not installed or not available in PATH. Please install Git to use this command."
    );
    return 1;
  }

  const inGitRepo = await inGitRepository();
  if (!inGitRepo) {
    log.error(
      "You are not in a Git repository. Please navigate to a Git repository to use this command."
    );
    return 1;
  }

  const stagedChanges = await getStaged();
  if (stagedChanges.length === 0) {
    log.error(
      "No staged changes found. Please stage some changes to use this command."
    );
    return 1;
  }

  const previousCommits = await previousGitCommitMessages(4);
  log.info(
    `Got ${previousCommits.length} previous commit messages for context.`
  );

  let context;

  if (options.context) {
    if( typeof options.context === 'string' && options.context.trim().length > 0 ) {
      context = options.context.trim();
    }
    else {
      context = await text({
        message:
          "Please provide additional instructions for the commit message generator:",
        placeholder: "e.g., Focus on performance improvements",
      });

      if (isCancel(context)) {
        log.error("Cancelled!");
        context = null;
      }
    }
  } 

  const branchName = await getBranchName();
  const commitGenSpinner = spinner();
  commitGenSpinner.start("Generating commit message...");
  const commitMessage = await getCommitMessage(stagedChanges, previousCommits, context, branchName);
  commitGenSpinner.stop("Commit message generated.");

  const trimmedMessage = commitMessage.trim();
  if (trimmedMessage.length === 0) {
    log.error("Failed to generate a commit message.");
    return 1;
  }

  // log the generated commit message
  log.info(commitMessage);

  let action = "menu";
  let toCommit = commitMessage;

  while (action === "menu") {
    action = await text({
      message:
        "Choose an action: (c)ommit, (e)dit message, (a)bort",
      placeholder: "c/e/a",
    });

    if (isCancel(action)) {
      log.error("Cancelled!");
      return 0;
    }

    action = action.toLowerCase();

    if (action === "e") {
      const editedMessage = await text({
        message: "Edit the commit message:",
        initialValue: toCommit,
      });

      if (isCancel(editedMessage)) {
        log.error("Cancelled!");
        return 0;
      }

      if (editedMessage.trim().length === 0) {
        log.error("Commit message cannot be empty.");
        action = "menu";
      } else {
        toCommit = editedMessage;
        action = "menu";
      }
    } else if (action === "a") {
      log.info("Aborted by user.");
      return 0;
    } else if (action !== "c") {
      log.error("Invalid action. Please choose c, e, r, or a.");
      action = "menu";
    }
  }


  const commitSuccess = await commitStaged(toCommit);
  if (commitSuccess) {
    log.success("Changes committed successfully.");
  } else {
    log.error("Failed to commit changes.");
  }

  outro("Done!");
  return 0;
}
