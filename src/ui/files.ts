import path from "node:path";
import { checkbox } from "@inquirer/prompts";
import { minimatch } from "minimatch";
import type { StagedFileInfo } from "../lib/git.ts";
import { dim, green, red } from "yoctocolors";

export function isIgnored(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    return minimatch(filePath, pattern, { matchBase: true });
  });
}

export interface FileSelection {
  full: string[];
  summarized: string[];
}

export async function selectFiles(
  files: StagedFileInfo[],
  ignorePatterns: string[],
  summarizePatterns: string[],
): Promise<FileSelection> {
  if (files.length === 0) return { full: [], summarized: [] };

  const choices = files.map((f) => {
    const ignored = isIgnored(f.path, ignorePatterns);
    const summarized = !ignored && isIgnored(f.path, summarizePatterns);
    const stats =
      f.additions === 0 && f.deletions === 0
        ? dim("binary")
        : `${green("+" + f.additions)} ${red("-" + f.deletions)}`;

    let suffix = "";
    if (ignored) suffix = dim(" (auto-ignored)");
    else if (summarized) suffix = dim(" (summarized)");

    return {
      name: `${f.path}  ${stats}${suffix}`,
      value: f.path,
      checked: !ignored,
      summarized,
    };
  });

  const selected = await checkbox({
    message: "Files to include in diff",
    choices,
  });

  const result: FileSelection = {
    full: [],
    summarized: [],
  };

  for (const filePath of selected) {
    const choice = choices.find((c) => c.value === filePath);
    if (choice?.summarized) {
      result.summarized.push(filePath);
    } else {
      result.full.push(filePath);
    }
  }

  return result;
}
