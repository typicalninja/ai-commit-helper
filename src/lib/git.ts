import { execa } from "execa";

export async function isGitRepo(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

export interface StagedFileInfo {
  path: string;
  additions: number;
  deletions: number;
}

export async function getStagedFileStats(): Promise<StagedFileInfo[]> {
  const { stdout } = await execa("git", ["diff", "--cached", "--numstat"]);
  if (!stdout?.trim()) return [];

  return stdout
    .trim()
    .split("\n")
    .map((line) => {
      const [add, del, ...pathParts] = line.split("\t");
      return {
        path: pathParts.join("\t"),
        additions: add === "-" ? 0 : Number.parseInt(add, 10),
        deletions: del === "-" ? 0 : Number.parseInt(del, 10),
      };
    });
}

export async function getStagedDiff(files?: string[]): Promise<string> {
  const args = ["diff", "--cached"];
  if (files?.length) args.push("--", ...files);
  const { stdout } = await execa("git", args);
  return stdout ?? "";
}

export async function getFileSummaries(
  files: string[],
  stats: StagedFileInfo[],
): Promise<string> {
  if (files.length === 0) return "";

  const summaries = files.map((file) => {
    const stat = stats.find((s) => s.path === file);
    if (!stat) return `${file}: no changes`;

    const isBinary = stat.additions === 0 && stat.deletions === 0;
    if (isBinary) {
      return `${file}: binary file changed`;
    }
    return `${file}: +${stat.additions} -${stat.deletions}`;
  });

  return summaries.join("\n");
}

export async function commit(message: string): Promise<void> {
  await execa("git", ["commit", "-m", message], { stdio: "inherit" });
}
