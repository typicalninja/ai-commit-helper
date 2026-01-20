import { ModelProvider } from "../provider";
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider extends ModelProvider {
    name = "gemini";
    models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3-pro-preview"];

    selectedModel: string;
    apiKey?: string;
    apiKeyRequired = true;

    private client: GoogleGenAI | null = null;

    constructor() {
        super();
        this.selectedModel = this.models[0];
    }
    
    async generateCommitMessage(context: string): Promise<string> {
        if(!this.client) {
            throw new Error("GeminiProvider: API client not initialized. Call setApiKey() first.");
        }
        // Placeholder implementation
        return `Generated commit message using Gemini for context: ${context}`;
    }

    setApiKey(key: string) {
        super.setApiKey(key);
        this.client = new GoogleGenAI({
            apiKey: key,
        });
    }
}
