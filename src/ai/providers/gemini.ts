import { getCommitGenerationPrompt } from "../prompts";
import { ModelProvider } from "../provider";
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider extends ModelProvider {
  name = "gemini";
  models = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
  ];

  selectedModel: string;
  apiKey?: string;
  apiKeyRequired = true;

  private client: GoogleGenAI | null = null;

  constructor() {
    super();
    this.selectedModel = this.models[0];
  }

  async generateCommitMessage(stagedDiffs: string, userContext?: string): Promise<string> {
    const { response } = await this.generateCommitMessageRaw(stagedDiffs, userContext);
    return response;
  }

  async generateCommitMessageRaw(stagedDiffs: string, userContext?: string): Promise<{ prompt: string; response: string }> {
    if (!this.client) {
      throw new Error(
        "GeminiProvider: API client not initialized. Call setApiKey() first.",
      );
    }
    const prompt = getCommitGenerationPrompt(stagedDiffs, userContext);
    const response = await this.client.models.generateContent({
      model: this.selectedModel,
      contents: prompt,
      config: {
        temperature: 0,
      },
    });

    if(!response.text) {
        throw new Error("GeminiProvider: No response text received from API.");
    }

    return { prompt, response: response.text.trim() };
  }

  setApiKey(key: string) {
    super.setApiKey(key);
    this.client = new GoogleGenAI({
      apiKey: key,
    });
  }
}
