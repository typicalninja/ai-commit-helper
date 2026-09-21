import { execa } from "execa";

const execGit = (...args: string[]) => execa("git", args);

/**
 * Get the diff for all staged files in the current repository.
 */
export async function getStagedDiffs() {
  const { stdout } = await execGit("diff", "--cached");
  return stdout.toString();
}

/**
 * Commit the currently staged files with the given message.
 * With `edit`, git opens the user's editor prefilled with the message (like `git commit -e`).
 */
export async function commitStaged(message: string, edit = false) {
  if (edit) {
    // git prints its own abort/hook errors on the inherited stdio, so don't throw
    await execa("git", ["commit", "-e", "-m", message], { stdio: "inherit", reject: false });
    return "";
  }
  const { stdout } = await execGit("commit", "-m", message);
  return stdout.toString();
}
