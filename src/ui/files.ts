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

export async function selectFiles(
  files: StagedFileInfo[],
  ignorePatterns: string[],
): Promise<string[]> {
  if (files.length === 0) return [];

  const choices = files.map((f) => {
    const ignored = isIgnored(f.path, ignorePatterns);
    const stats =
      f.additions === 0 && f.deletions === 0
        ? dim("binary")
        : `${green("+" + f.additions)} ${red("-" + f.deletions)}`;

    return {
      name: `${f.path}  ${stats}${ignored ? dim(" (auto-ignored)") : ""}`,
      value: f.path,
      checked: !ignored,
    };
  });

  return checkbox({
    message: "Files to include in diff",
    choices,
  });
}
