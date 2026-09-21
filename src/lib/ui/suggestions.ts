import { Prompt, TextPrompt } from "@clack/core";
import color from "yoctocolors";
import type { CommitMessage } from "../llms/generate";

export type Pick = { action: "commit" | "edit" | "regenerate"; message: CommitMessage };

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

/** diffstat capped to a screenful: first files, then the "N files changed" summary line */
function statLines(stat: string, max = 12) {
  const lines = stat.split("\n");
  return lines.length <= max ? lines : [...lines.slice(0, max - 2), `… ${lines.length - max + 1} more files`, lines.at(-1)!];
}

/** Card carousel: <-/-> browse, enter commit, e edit, r regenerate, d files, q/esc quit. Returns CANCEL symbol on quit. */
export function pickCommit(messages: CommitMessage[], stat = "") {
  let index = 0;
  let showStat = false;
  const bar = color.gray("│");

  const prompt = new Prompt<Pick>(
    {
      render() {
        const m = messages[index];
        if (this.state === "submit") {
          const head = formatCommit(m).split("\n")[0];
          if (this.value?.action === "regenerate") return color.dim(`↻  ${head}`);
          if (this.value?.action === "edit") return `${color.cyan("✎")}  ${head}`;
          return `${color.green("✔")}  ${head}`;
        }
        if (this.state === "cancel") return `${color.red("■")}  cancelled`;

        const width = Math.min((process.stdout.columns || 80) - 4, 72);
        const tc = typeColor[m.type] ?? color.yellow;
        const head = `${tc(color.bold(m.type))}${color.dim(m.scope ? `(${m.scope})` : "")}${m.breaking_change ? color.red("!") : ""}: ${m.description}`;
        const body = [m.body, m.footer].filter(Boolean).flatMap((p) => ["", ...wrap(p!, width)]);
        return [
          `${color.gray("┌")}  ${color.dim(`suggestion ${index + 1}/${messages.length}`)}`,
          ...[head, ...body].map((l) => `${bar}  ${l}`),
          ...(showStat ? [bar, ...statLines(stat).map((l) => `${bar}  ${color.dim(l)}`)] : []),
          `${color.gray("└")}  ${color.dim("←/→ browse · enter commit · e edit · r regenerate · d files · q quit")}`,
        ].join("\n");
      },
    },
    false,
  );

  prompt.on("key", (char, key) => {
    if (key.name === "left") index = (index + messages.length - 1) % messages.length;
    else if (key.name === "right") index = (index + 1) % messages.length;
    else if (char === "d") showStat = !showStat;
    const action = char === "r" ? "regenerate" : char === "e" ? "edit" : "commit";
    if (action !== "commit") prompt.state = "submit";
    if (char === "q") prompt.state = "cancel";
    prompt.value = { action, message: messages[index] };
  });

  return prompt.prompt();
}

/** Optional instructions for a regenerate. Returns "" to skip, CANCEL symbol on esc (go back). */
export function askFeedback() {
  return new TextPrompt({
    render() {
      if (this.state === "submit") return `${color.cyan("↻")}  regenerating${this.userInput ? `: ${this.userInput}` : ""}`;
      if (this.state === "cancel") return `${color.gray("■")}  back`;
      const input = this.userInput
        ? this.userInputWithCursor
        : `${color.inverse(" ")}${color.dim("e.g. keep the description, add a body")}`;
      return [
        `${color.cyan("◆")}  regenerate instructions ${color.dim("(optional · enter to skip · esc to go back)")}`,
        `${color.gray("│")}  ${input}`,
      ].join("\n");
    },
  }).prompt();
}
