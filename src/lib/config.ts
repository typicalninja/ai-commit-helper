import fs from 'node:fs/promises';

class ConfigManager {
    private config_name: string;
    /**
     * Indicates whether the configuration has unsaved changes.
     */
    private dirty: boolean = false;
    /**
     * In-memory representation of the configuration settings.
     */
    private config: Record<string, any> = {};

    constructor() {
        this.config_name = `aic.config.json`;
    }

    async sync() {
        if(this.dirty) {
            // Save the config to disk
            this.dirty = false;
            await fs.writeFile(this.config_name, JSON.stringify(this.config, null, 2));
        }
    }

    async load() {
        try {
            const data = await fs.readFile(this.config_name, 'utf-8');
            this.config = JSON.parse(data);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                // File does not exist, start with empty config
                this.config = {};
            } else {
                throw error;
            }
        }

        return this;
    }

    set(key: string, value: any) {
        this.config[key] = value;
        this.dirty = true;
    }

    get(key: string): any {
        return this.config[key];    
    }

    hasKeys(): boolean {
        return Object.keys(this.config).length > 0;
    }

    toString(): string {
        return JSON.stringify(this.config, null, 2);
    }

    toStringPretty(): string {
        return Object.entries(this.config)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
    }
}


export default (await new ConfigManager().load());