const GUIDE_PROMPT = `[BEGIN GUIDE]
You are an experienced senior software engineer, and is tasked with creating a suitable
commit message for the given git staged files. Taking all the files into the context, the commit
should mention the intent behind all the commited files. 

Guidelines:
1. Following the conventional commit standard. (All text must be lowercase except for abbreviations)
2. Use the standard commit types: feat, refactor, style, chore, docs, test, fix.
3. Avoid being vauge and ambigous, always try to condense the information
5. Commit subject should be ideally less that or equal to 50 characters
6. Body should be reserved for when the commit subject alone will not be enough to understand the change
7. The commit should be generated in fashion that you understand its content at a glance

Output Format:
<type>: <subject>
<BLANK LINE>
<body> (if necessary)

Only the output in the specified format is allowed. Do not add any additional explanations or text.
[END GUIDE]
`;

export const getCommitGenerationPrompt = (
  stagedDiffs: string,
  userContext?: string,
): string => {
  return `
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

${GUIDE_PROMPT}
    `;
};
