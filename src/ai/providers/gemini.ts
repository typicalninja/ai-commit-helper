import { ModelProvider } from "../provider";

export class GeminiProvider extends ModelProvider {
    name = "gemini";
    models = ["gemini-1.5", "gemini-1.5-pro", "gemini-2", "gemini-2-pro"];

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