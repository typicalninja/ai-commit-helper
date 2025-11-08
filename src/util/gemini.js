import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from "./config.js";

export async function getGenAI() {
  return new GoogleGenAI({
    apiKey: await getApiKey(),
  });
}

const prompt = (diff, previousCommits, additionalInstructions, branchName) => `
You are an expert Git commit message generator.

Generate a single, clear, Conventional Commit–style message summarizing the given diff. 
Follow best practices for concise, human-readable, high-quality commit messages.
### Rules
- Format: <type>[optional scope]: <short summary>
- Example: feat: add user authentication middleware
- Title:
  - ≤72 chars, imperative mood, lowercase.
  - Include type inferred from diff.
  - Add scope only if confidently inferred from prior commits and diff context.
- Allowed types: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert, or justified custom types.
- Optional body: only if change is complex or multi-part; keep it short and plain (no markdown, lists, or repetition).

### Guidelines
- Infer intent from diff and commit history, and filenames.
- Prioritize accuracy, clarity, and developer readability.
- Prefer the least-specific valid type if unsure or "chore" if unable to determine.
- Output only the commit message (no commentary).

---
Context:
Branch: ${branchName}
Previous commits:
${previousCommits.join("\n")}
Diff:
${diff.join("\n")}
${
  additionalInstructions
    ? `\nAdditional instructions: ${additionalInstructions}`
    : ""
}`;

export async function getCommitMessage(
  diff,
  previousCommits,
  additionalInstructions,
  branchName
) {
  const ai = await getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt(diff, previousCommits, additionalInstructions, branchName),
  });

  return response.text;
}
