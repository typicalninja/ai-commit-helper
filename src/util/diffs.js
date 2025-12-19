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
  // extract flags
  // 3 states a file can be in
  // 1 -> a new file
  // 2 -> a deleted file
  // 3 -> a modified file
  // modified file can mean either content changes or rename of file
  const newFile = file.new;
  const deletedFile = file.deleted;
  const modifiedFile = !newFile && !deletedFile;
  // renamed is implied by from and to fields being different
  const renamed = modifiedFile && file.from && file.to && (file.from !== file.to);
  let out = "File: ";

  if(newFile) {
    // new file have only 'to' field
    // and from is /dev/null
    out += `ADDED ${file.to}`;
  }
  else if(deletedFile) {
    // deleted file have only 'from' field
    // and to is /dev/null
    out += `DELETED ${file.from}`;
  }
  else if(renamed) {
    out += `RENAMED ${file.from} → ${file.to}`;
  }
  else {
    // modified file
    out += `MODIFIED ${file.to}`;
  }
  
  // add the deletion/addition stats
  out += ` (+${file.additions} -${file.deletions})\n`;

  if (file.binary) {
    return out + "[Binary file changes omitted]";
  }

  if (isNoisyFile(file)) {
    return out + `[Diff omitted due to large changes]`;
  }

  let lines = 0;
  const MAX_LINES = 40;

  for (const chunk of file.chunks) {
    out += chunk.content + "\n";
    for (const change of chunk.changes) {
      if (change.type === "add" || change.type === "del") {
        out +=
          `${change.type === "add" ? "+" : "-"}${change.content}\n`;
        // if (++lines >= MAX_LINES) {
        //   const omittedLines = file.additions + file.deletions - lines;
        //   out += `[... ${omittedLines} more lines omitted ...]\n`;
        //   return out;
        // }
      }
    }
  }

  return out.toString();
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
