import config from "../lib/config-manager.ts";
import colors from "yoctocolors";

export default async function configHandlerCommand(configKey?: string, configValue?: string) {
    // No arguments: List all properties (git config --list)
    if (!configKey) {
        if (config.hasKeys()) {
            console.log(config.toStringPretty());
        }
        return;
    }

    // Only key provided: Get value (git config user.name)
    if (configValue === undefined) {
        const value = config.get(configKey);
        if (value !== undefined) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // If it's a section/object, print its contents in key=value format
                Object.entries(value).forEach(([k, v]) => {
                    console.log(`${configKey}.${k}=${v}`);
                });
            } else {
                console.log(value);
            }
        }
        else {
            console.log(`${colors.red('error:')} key ${colors.cyan(configKey)} not found`);
        }
        return;
    }

    const previousValue = config.get(configKey);
    // Both key and value provided: Set (git config user.name "value")
    config.set(configKey, configValue);
    const errors = config.validate();
    if (errors) {
        console.log(`${colors.red('error:')} config has errors \n${errors.map(e => ` - ${e}`).join('\n')}`);
        return;
    }

    await config.sync();

    if(previousValue !== undefined) {
        if(previousValue === configValue) {
            console.log(`${colors.cyan(configKey)} is already set to ${colors.italic(configValue)}`);
            return;
        }
        
        console.log(`${colors.cyan(configKey)} ${colors.yellow('changed from')} ${colors.italic(previousValue)} ${colors.yellow('to')} ${colors.italic(configValue)}`);
        return;
    }

    console.log(`${colors.cyan(configKey)} ${colors.green('set')} to ${colors.italic(configValue)}`);
}
