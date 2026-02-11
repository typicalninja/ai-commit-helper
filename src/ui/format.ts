import { bold, dim, green, red, yellow } from "yoctocolors";

export function error(msg: string): string {
  return `${red("error")} ${msg}`;
}

export function warn(msg: string): string {
  return `${yellow("warn")} ${msg}`;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "********";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

export function commitBox(message: string): string {
  const lines = message.split("\n");
  return [
    "",
    `${bold(green(">>"))} ${bold("Commit Message")}`,
    ...lines.map((l) => `${dim("|")} ${l}`),
    "",
  ].join("\n");
}

export function fileEntry(
  filePath: string,
  additions: number,
  deletions: number,
  ignored: boolean,
): string {
  if (ignored) {
    return `${dim("o")} ${dim(filePath)}  ${dim("(ignored)")}`;
  }
  const stats =
    additions === 0 && deletions === 0
      ? dim("binary")
      : `${green("+" + additions)} ${red("-" + deletions)}`;
  return `${green("*")} ${filePath}  ${stats}`;
}
