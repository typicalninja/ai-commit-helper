import { GoogleGenAI } from "@google/genai";
import { COMMIT_SYSTEM_PROMPT } from "./base.js";

export class GoogleAIClient  {
  #client;

  constructor(apiKey) {
    this.#client = new GoogleGenAI({ apiKey });
  }

  async generateCommitMessage(prompt) {
    const response = await this.#client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: COMMIT_SYSTEM_PROMPT
      }
    });
    return response.text;
  }
}