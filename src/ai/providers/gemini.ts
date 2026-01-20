import { ModelProvider } from "../provider";

export class GeminiProvider extends ModelProvider {
    name = "gemini";
    models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3-pro-preview"];

    selectedModel: string;

    constructor(model?: string) {
        super();
        this.selectedModel = model || this.models[0];
    }
    
    async generateCommitMessage(context: string): Promise<string> {
        // Placeholder implementation
        return `Generated commit message using Gemini for context: ${context}`;
    }
}