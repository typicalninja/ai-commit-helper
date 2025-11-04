import { execa } from "execa";

export async function hasGitInstalled() {
  try {
    await execa`git --version`;
    return true;
  } catch {
    return false;
  }
}

export async function inGitRepository() {
  try {
    const { exitCode } = await execa`git rev-parse --is-inside-work-tree`;
    return exitCode === 0;
  } catch {
    return false;
  }
}

export async function getStaged() {
    try {
        const { stdout, exitCode } = await execa`git diff --staged`;
        if (exitCode !== 0) {
            throw new Error("Failed to get staged files");
        }
        return stdout.split("\n").filter(Boolean);
    } catch {
        return [];
    }
}

export async function previousGitCommitMessages(n = 5) {
  try {
    const { stdout, exitCode } = await execa`git log -n ${n}`;
    if (exitCode !== 0) {
      throw new Error("Failed to get git commit messages");
    }
    const lines = stdout
      .split("\n")
      .filter(Boolean)
      .filter(
        (line) => !line.startsWith("Author:") && !line.startsWith("Date:")
      );
    return lines
      .map((line) => line.trim().replace(/^.*? - /, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}
