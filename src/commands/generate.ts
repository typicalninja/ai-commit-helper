import configManager from "../lib/config-manager";
import { providerManager } from "../lib/provider-manager";
import { cyan, dim, red } from "yoctocolors";

export default function runGenerateCommand(contextOpt: string[]) {
    const userContext = contextOpt.join(' ');
    const model = configManager.get('provider.model');
    const provider = providerManager.resolveProviderForModel(model);

    if(!provider) {
        console.log(`${red('error:')} No provider found for model ${cyan(model)}. Please check your configuration. [key: provider.model]`);
        return;
    }
    
    console.log(`provider > ${provider.getName()} [${cyan(provider.selectedModel)}]`);

    
}