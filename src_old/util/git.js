import { execa } from "execa";

//
// Low-level helpers
//

/**
 * Run a git command.
 *
 * Always throws on failure so callers can decide how to handle errors.
 */
export async function runGit(args, options = {}) {
  const result = await execa("git", args, options);
  return result;
}

/** Ensure git is installed; returns the version string or throws on failure. */
export async function ensureGitInstalled() {
  const { stdout } = await runGit(["--version"]);
  return stdout.trim();
}

/** Backwards-compatible helper used by the CLI; returns a boolean instead of throwing. */
export async function hasGitInstalled() {
  try {
    await ensureGitInstalled();
    return true;
  } catch {
    return false;
  }
}

/** Ensure the current working directory is inside a git work tree. */
export async function ensureInGitRepository() {
  const { stdout } = await runGit(["rev-parse", "--is-inside-work-tree"]);
  return stdout.trim() === "true";
}

/** Get the current branch name or throw on failure. */
export async function getCurrentBranchName() {
  const { stdout } = await runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout.trim();
}


//
// Staged changes
//

/**
 * Get staged changes (diff) as a single unified diff string.
 * Throws if git fails.
 */
export async function getStagedDiff() {
  const { stdout } = await runGit(["diff", "--cached"]);
  return stdout;
}

/**
 * Get staged files as structured data using `git diff --cached --name-status`.
 * Each entry is of the form: { status, path }.
 */
export async function getStagedFiles() {
  const { stdout } = await runGit(["diff", "--cached", "--name-status"]);
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.trim().split(/\s+/);
      return { status, path: rest.join(" ") };
    });
}

/**
 * Backwards-compatible helper used by the current CLI.
 * Returns an array of non-empty diff lines, or an empty array on failure.
 */
export async function getStaged() {
  try {
    const diff = await getStagedDiff();
    return diff.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

//
// Commit history
//

function parseGitLog(raw) {
  return raw
    .split("\x1e")
    .filter(Boolean)
    .map((entry) => {
      const [hash, authorName, authorEmail, authorDate, subject, body] = entry.split("\x1f");
      return {
        // clean up the commit hash if needed (remove all newlines)
        hash: hash.trim().replace(/\n/g, ""),
        authorName,
        authorEmail,
        authorDate,
        subject,
        body: (body || "").trim(),
      };
    });
}

/**
 * Get recent commits as structured objects.
 */
export async function getRecentCommits(n = 5) {
  const format = "%H%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b%x1e";
  const { stdout } = await runGit([
    "log",
    "-n",
    String(n),
    "--date=iso-strict",
    `--pretty=format:${format}`,
  ]);
  return parseGitLog(stdout);
}

/**
 * Backwards-compatible helper that returns only the commit subjects.
 */
export async function previousGitCommitMessages(n = 5) {
  try {
    const commits = await getRecentCommits(n);
    return commits.map((c) => c.subject).filter(Boolean);
  } catch {
    return [];
  }
}

//
// Committing
//

/**
 * Commit staged changes with the given message.
 *
 * Throws if git fails and returns the raw stdout on success.
 */
export async function commit(message, options = {}) {
  const args = ["commit"]; // allow room for -a etc.
  if (options.all) {
    args.push("-a");
  }
  args.push("-m", message);

  const { all, ...execaOptions } = options;
  const result = await runGit(args, execaOptions);
  return result.stdout;
}

/**
 * Backwards-compatible helper used by the current CLI; returns a boolean.
 */
export async function commitStaged(message) {
  try {
    await commit(message);
    return true;
  } catch {
    return false;
  }
}
