const GUIDE_PROMPT = `[BEGIN GUIDE]
You are an AI assistant that helps generate concise and clear git commit messages based on the provided staged diffs.
When generating commit messages, follow these guidelines:

1. Summarize the changes made in the staged diffs.
2. Use the imperative mood (e.g., "Fix bug" instead of "Fixed bug" or "Fixes bug").
3. Keep the commit message brief and to the point, ideally under 50 characters for the subject line.
4. If necessary, provide a more detailed description in the body of the commit message, separated from the subject line by a blank line.
5. Avoid using vague terms like "update" or "change"; be specific about what was changed.
6. Use conventional commit message prefixes (e.g., "feat:", "fix:", "docs:", "style:", "refactor:", "test:", "chore:").
7. Ensure proper grammar and spelling.
Here are some examples of well-formed commit messages:
- feat: add user authentication module
- fix: resolve crash on app startup
- docs: update API documentation for new endpoints
- style: format codebase with Prettier
- refactor: optimize database query performance
- test: add unit tests for user service
- chore: update dependencies to latest versions

Please generate the commit message based solely on the provided staged diffs and the above guidelines.
Do not include any explanations or additional text outside of the commit message itself. your message should 
be able to be directly used as a git commit message.
[END GUIDE]
`;

export const getCommitGenerationPrompt = (
  stagedDiffs: string,
  userContext?: string,
): string => {
  return `${GUIDE_PROMPT}
[BEGIN STAGED DIFFS]
${stagedDiffs}
[END STAGED DIFFS]

${
  userContext
    ? `[BEGIN USER CONTEXT]
${userContext}
[END USER CONTEXT]`
    : ""
}
    `;
};
