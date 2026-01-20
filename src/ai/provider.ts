export abstract class ModelProvider {
  /**
   * Public name of the model provider
   * Will be shown in the CLI options and used for selection
   */
  abstract name: string;
  /**
   * List of available models for this provider
   */
  abstract models: string[];

  abstract selectedModel: string;
  abstract apiKey?: string;
  abstract apiKeyRequired: boolean;

  /**
   * Warning limit for string token length 
   * Will emit a warning if the input context exceeds this limit
   * However, it will still attempt to process the input
   */
  stringTokenWarnLimit = 5000;

  abstract generateCommitMessage(stagedDiffs: string, userContext?: string): Promise<string>;
  
  getName(): string {
    return this.constructor.name;
  }

  selectModel(model: string) {
    if (this.models.includes(model)) {
      this.selectedModel = model;
    } else {
      throw new Error(`Model ${model} is not supported by ${this.getName()}`);
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

}