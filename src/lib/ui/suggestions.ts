import { Prompt } from "@clack/core";
import color from "yoctocolors";
import type { CommitMessage } from "../llms/generate";

export type Pick = { action: "commit" | "regenerate"; message: CommitMessage };

const typeColor: Record<string, (s: string) => string> = {
  feat: color.green,
  fix: color.red,
  perf: color.magenta,
  refactor: color.cyan,
  style: color.gray,
};

export function formatCommit(m: CommitMessage) {
  const head = `${m.type}${m.scope ? `(${m.scope})` : ""}${m.breaking_change ? "!" : ""}: ${m.description}`;
  return [head, m.body, m.footer].filter(Boolean).join("\n\n");
}

function wrap(text: string, width: number) {
  return text.split("\n").flatMap((para) => {
    const lines: string[] = [];
    let line = "";
    for (const word of para.split(" ")) {
      if (line && line.length + 1 + word.length > width) {
        lines.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    return [...lines, line];
  });
}

/** Card carousel: <-/-> browse, enter commit, r regenerate, q/esc quit. Returns CANCEL symbol on quit. */
export function pickCommit(messages: CommitMessage[]) {
  let index = 0;
  const bar = color.gray("│");

  const prompt = new Prompt<Pick>(
    {
      render() {
        const m = messages[index];
        if (this.state === "submit") return `${color.green("✔")}  ${formatCommit(m).split("\n")[0]}`;
        if (this.state === "cancel") return `${color.red("■")}  cancelled`;

        const width = Math.min((process.stdout.columns || 80) - 4, 72);
        const tc = typeColor[m.type] ?? color.yellow;
        const head = `${tc(color.bold(m.type))}${color.dim(m.scope ? `(${m.scope})` : "")}${m.breaking_change ? color.red("!") : ""}: ${m.description}`;
        const body = [m.body, m.footer].filter(Boolean).flatMap((p) => ["", ...wrap(p!, width)]);
        return [
          `${color.gray("┌")}  ${color.dim(`suggestion ${index + 1}/${messages.length}`)}`,
          ...[head, ...body].map((l) => `${bar}  ${l}`),
          `${color.gray("└")}  ${color.dim("←/→ browse · enter commit · r regenerate · q quit")}`,
        ].join("\n");
      },
    },
    false,
  );

  prompt.on("key", (char, key) => {
    if (key.name === "left") index = (index + messages.length - 1) % messages.length;
    else if (key.name === "right") index = (index + 1) % messages.length;
    const regenerate = char === "r";
    if (regenerate) prompt.state = "submit";
    if (char === "q") prompt.state = "cancel";
    prompt.value = { action: regenerate ? "regenerate" : "commit", message: messages[index] };
  });

  return prompt.prompt();
}
