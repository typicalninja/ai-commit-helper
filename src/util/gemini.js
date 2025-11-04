import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from "./config.js";

export async function getGenAI() {
  return new GoogleGenAI({
    apiKey: await getApiKey(),
  });
}

const prompt = `You are an expert git commit message generator. 
Given the following diff and previous commit messages, generate a concise and descriptive git commit message that accurately summarizes the changes made in the diff.
Ensure the message is clear and follows best practices for commit messages. (conventional commit style is preferred)
Always prefer short conventional commit style titles (<= 72 chars).
Only the title should be their and is mandatory, keep the description to complex changes only.`

export async function getCommitMessage(diff, previousCommits) {
  const ai = await getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `${prompt}\n\nPrevious commit messages:\n${previousCommits.join("\n")}\n\nDiff:\n${diff.join("\n")}`,
  })

  return response.text;
}
