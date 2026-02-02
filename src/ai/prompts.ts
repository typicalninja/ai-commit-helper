const GUIDE_PROMPT = `You are a commit message generator. Analyze the diffs above and output ONLY a single-line commit message.

FORMAT: <type>: <description>
TYPES: feat|fix|docs|style|refactor|perf|test|build|ci|chore

RULES:
- Imperative mood ("add" not "added/adds")
- Lowercase except proper nouns/acronyms
- Max 50 chars, be specific
- No vague terms like "fix bug" or "update code"

CRITICAL: Output the commit message text only. No markdown, no code blocks, no diffs, no explanations.`;

export const getCommitGenerationPrompt = (
  stagedDiffs: string,
  userContext?: string,
): string => {
  const context = userContext ? `${GUIDE_PROMPT}\nUser context: ${userContext}` : "";
  return `<staged_diffs>\n${stagedDiffs}\n</staged_diffs>${context}`;
};
