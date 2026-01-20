import fs from 'node:fs/promises';
import { z } from 'zod';

const configSchema = z.object({
    provider: z.object({
        // Name of the model provider to use
        // by default "auto" is used to select the best available provider
        model: z.string().default("auto"),
    }),
});

export type Config = z.infer<typeof configSchema>;

class ConfigManager {
    private config_name: string;
    private dirty: boolean = false;
    private config: Config = configSchema.parse({
        provider: {
            model: "auto",
        }
    });

    constructor() {
        this.config_name = `aic.config.json`;
    }

    async sync() {
        if (this.dirty) {
            this.dirty = false;
            await fs.writeFile(this.config_name, JSON.stringify(this.config, null, 2));
        }
    }

    async load() {
        try {
            const data = await fs.readFile(this.config_name, 'utf-8');
            const parsed = JSON.parse(data);
            this.config = configSchema.parse(parsed);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.config = configSchema.parse({});
            } else {
                throw error;
            }
        }
        return this;
    }

    set(path: string, value: any) {
        const keys = path.split('.');
        let current: any = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;

        // Re-validate the entire config
        this.config = configSchema.parse(this.config);
        this.dirty = true;
    }

    get(path: string): any {
        const keys = path.split('.');
        let current: any = this.config;

        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            if (!(key in current)) return undefined;
            current = current[key];
        }

        return current;
    }

    hasKeys(): boolean {
        return Object.keys(this.config).length > 0;
    }

    all(): Config {
        return this.config;
    }

    toString(): string {
        return JSON.stringify(this.config, null, 2);
    }

    toStringPretty(): string {
        const flatten = (obj: any, prefix = ''): string[] => {
            return Object.entries(obj).flatMap(([key, value]) => {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return flatten(value, newKey);
                }
                return [`${newKey}=${value}`];
            });
        };
        return flatten(this.config).join('\n');
    }
}


export default (await new ConfigManager().load());