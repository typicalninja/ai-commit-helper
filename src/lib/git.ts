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
 */
export async function commitStaged(message: string) {
  const { stdout } = await execGit("commit", "-m", message);
  return stdout.toString();
}
