import { execa } from "execa";

const execGit = (...args: string[]) => execa("git", args);

/**
 * Get the diff for all staged files in the current repository.
 */
export async function getStagedDiffs() {
  const { stdout } = await execGit("diff", "--cached");
  return stdout.toString();
}
