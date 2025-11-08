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

  const toCommit = await text({
    message: "Generated Commit Message:",
    initialValue: commitMessage.trim(),
  });
  if(isCancel(toCommit)) {
    log.info("Commit will need to be done manually.");
    return 0;
  }

  const autoCommit = options.auto || false;
  const shouldCommit =
    toCommit &&
    (autoCommit ||
      (await confirm({
        message: "Do you want to commit with this message?",
        initialValue: true,
      })));

  if (isCancel(shouldCommit) || !shouldCommit) {
    log.info("Commit message not used.");
    return 0;
  }

  const commitSuccess = await commitStaged(toCommit);
  if (commitSuccess) {
    log.success("Changes committed successfully.");
    return 0;
  } else {
    log.error("Failed to commit changes.");
    return 1;
  }
}
