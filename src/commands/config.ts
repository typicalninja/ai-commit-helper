import config from "../lib/config.ts";
import { edit } from "@inquirer/external-editor";


export default async function configHandlerCommand(configKey?: string, configValue?: string) {
    // if configKey is not provided, it is guranteed that configValue is also not provided
    // as it is a positional argument after configKey
    if(!configKey) {
        // no arguments provided, show all config
        if(config.hasKeys()) {
            console.log("Showing all configuration settings...");
            edit(config.toStringPretty());
        }
        else {
            console.log("No configuration settings found.");
        }

        return;
    } 
    
    if(!configValue) {
        // only key provided, show value
        const value = config.get(configKey);
        if(value !== undefined) {
            console.log(`Configuration for '${configKey}': ${value}`);
        } else {
            console.log(`No configuration found for key '${configKey}'.`);
        }
        return;
    }

    const oldValue = config.get(configKey);
    // both key and value provided, set config
    config.set(configKey, configValue);

    await config.sync();
    console.log(`Configuration updated: ${configKey} = ${oldValue} -> ${configValue}`);
}