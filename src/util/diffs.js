import { dim, bold, green, red } from "yoctocolors";

// Files to more aggressively cull from diffs due to their typically large and noisy diffs
const EXPECTED_NOISY_FILENAMES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Cargo.lock",
  "go.sum",
  "composer.lock",
];
const NOISY_FILE_THRESHOLD = 20; // total diff size

export function isNoisyFile(file) {
  const totalChanges = file.additions + file.deletions;
  const isExpectedNoisyFile = EXPECTED_NOISY_FILENAMES.includes(file.to || file.from);
  return isExpectedNoisyFile && totalChanges > NOISY_FILE_THRESHOLD;
}

// Converts a parsed diff file object into a string representation
// to be sent to an AI model as such it is minimal as possible to save tokens
export function diffFileToString(file) {
  const name = file.renamed
    ? `${file.from} → ${file.to}`
    : file.to || file.from;

  const operation = file.deleted ? "Deleted" : file.new ? "New File" : "Modified";

  if (file.binary) {
    return `File: ${operation} ${name}\n[Binary file omitted]\n`;
  }

  if (isNoisyFile(file)) {
    return `File: ${operation} ${name} (+${file.additions} -${file.deletions})\n[Diff omitted]\n`;
  }

  let out = `File: ${operation} ${name} (+${file.additions} -${file.deletions})\n`;

  let lines = 0;
  const MAX_LINES = 40;

  for (const chunk of file.chunks) {
    for (const change of chunk.changes) {
      if (change.type === "add" || change.type === "del") {
        out +=
          `${change.type === "add" ? "+" : "-"}${change.content}\n`;
        if (++lines >= MAX_LINES) {
          const omittedLines = file.additions + file.deletions - lines;
          out += `[... ${omittedLines} more lines omitted ...]\n`;
          return out;
        }
      }
    }
  }

  return out;
}


/**
 * Convert a parsed diff file object into a simplified loggable string representation.
 * @param {*} file
 * @returns
 */
export function getDiffSimplified(file) {
  const name = file.renamed
    ? `${file.from} → ${file.to}`
    : file.from || file.to;

  const status = file.new
    ? green("NEW ")
    : file.deleted
    ? red("DEL ")
    : dim("MOD ");

  const changes = file.binary
    ? dim("binary")
    : `${green(`+${file.additions}`)} ${red(`-${file.deletions}`)}`;

  return `${status} ${changes.padEnd(12)} <::> ${bold(name)}`;
}
