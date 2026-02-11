const SYSTEM = `Generate a git commit message from the diff below.

Format: <type>: <description>

Types: feat|fix|docs|style|refactor|perf|test|build|ci|chore
Rules: imperative mood, lowercase, max 72 chars, be specific.
If a body is needed, add a blank line then wrap at 72 chars.

Output ONLY the commit message text. No markdown, no code fences, no explanations.`;

export function buildPrompt(diff: string, context?: string): string {
  let prompt = SYSTEM + "\n\n" + diff;
  if (context) prompt += `\n\nContext: ${context}`;
  return prompt;
}
