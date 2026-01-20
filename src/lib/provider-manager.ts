import { ModelProvider } from "../ai/provider";

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

        return undefined;
    }
}


function registerDefaultProviders(manager: ProviderManager) {
    // Import and register default providers here
    manager.addProviders([
        new GeminiProvider(),
    ]);
}

export const providerManager = new ProviderManager();

registerDefaultProviders(providerManager);