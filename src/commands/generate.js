import { getCommitMessage } from "../util/gemini.js";
import {
  hasGitInstalled,
  inGitRepository,
  previousGitCommitMessages,
  getStaged,
} from "../util/git.js";

export default async function generateCommand(options) {
  const hasGit = await hasGitInstalled();
  if (!hasGit) {
    console.error(
      "Git is not installed or not available in PATH. Please install Git to use this command."
    );
    return 1;
  }

  const inGitRepo = await inGitRepository();
  if (!inGitRepo) {
    console.error(
      "You are not in a Git repository. Please navigate to a Git repository to use this command."
    );
    return 1;
  }

  const stagedChanges = await getStaged();
  if (stagedChanges.length === 0) {
    console.error(
      "No staged changes found. Please stage some changes to use this command."
    );
    return 1;
  }

  const previousCommits = await previousGitCommitMessages(4);
  console.log(
    `Got ${previousCommits.length} previous commit messages for context.`
  );

  const commitMessage = await getCommitMessage(stagedChanges, previousCommits);
  console.log("Generated commit message:\n\n");
  console.log(commitMessage)
}
