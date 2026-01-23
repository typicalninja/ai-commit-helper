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

Now Follow these steps:
1. Provide your initial commit message.
2. Generate 3-5 verification questions that would expose errors and inconsistensies in your answer, they should question the accuracy, completeness and relevance of your commit message. things such as "Does the chosen commit type accurately reflect the changes made?" or "Are there any important changes that have been omitted from the commit message?" (these questions should not be outputted)
3. Answer each verification question independently
4. Provide your final revised commit based on the verification, only the commit message and nothing else

Output: Output the final revised commit message from step 4, do not include any other step, just the final commit message.
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
