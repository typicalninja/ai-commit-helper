import configManager from "../lib/config-manager";
import { providerManager } from "../lib/provider-manager";

export default async function setKeyCommand() {
  const model = configManager.get("provider.model");
  const provider = providerManager.resolveProviderForModel(model);

  if(!provider) {
    console.log(`No provider found for model ${model}. Please check your configuration. [key: provider.model]`);
    return;
  }

  void await providerManager.setupProviderApiKey(provider.getName());
}
