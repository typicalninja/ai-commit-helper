import { ModelProvider } from "../ai/provider";
import keytar from "keytar";

// default providers
import { GeminiProvider } from "../ai/providers/gemini";

class ProviderManager {
  private providers: Map<string, ModelProvider> = new Map();
  private modelProviderMap: Map<string, string> = new Map();

  addProvider(provider: ModelProvider) {
    this.providers.set(provider.getName(), provider);
    // Map each model to this provider
    for (const model of provider.models) {
      this.modelProviderMap.set(model, provider.getName());
    }
  }

  addProviders(providers: ModelProvider[]) {
    for (const provider of providers) {
      this.addProvider(provider);
    }
  }

  getProvider(name: string): ModelProvider | undefined {
    return this.providers.get(name);
  }

  resolveProviderForModel(model: string): ModelProvider | undefined {
    // model can be auto or specific model name
    // if auto, select the first available provider
    if (model === "auto") {
      return this.providers.values().next().value;
    }

    // Check if model maps to a provider
    const providerName = this.modelProviderMap.get(model);
    if (providerName) {
      return this.providers.get(providerName);
    }

    // last check if a provider was mentioned directly
    // this will select a default model from that provider
    if (this.providers.has(model)) {
      return this.providers.get(model);
    }

    return undefined;
  }

  /**
   * Gets and prepared a provider to be used
   * @param model
   * @returns
   */
  async getPreparedProvider(model: string) {
    const provider = this.resolveProviderForModel(model);
    if (!provider) {
      return undefined;
    }

    // select model if a specific model is given
    if (model !== "auto" && provider.models.includes(model)) {
      provider.selectModel(model);
    }

    // setup api key
    const apiKeyAccount = `aic-provider-${provider.getName()}`;
    const apiKey = await keytar.getPassword("aic-cli", apiKeyAccount);

    // if api key is required but not found, start setup process
    if (provider.apiKeyRequired) {
      if (apiKey) {
        provider.setApiKey(apiKey);
      } else {
        throw new Error(
          `API key for provider ${provider.getName()} is required but not set. Please set it up before using this provider.`,
        );
      }
    }

    return provider;
  }
}

function registerDefaultProviders(manager: ProviderManager) {
  // Import and register default providers here
  manager.addProviders([new GeminiProvider()]);
}

export const providerManager = new ProviderManager();

registerDefaultProviders(providerManager);
