import fs from 'node:fs/promises';
import { z } from 'zod';
import path from 'node:path';
import os from 'node:os';

const configSchema = z.object({
    provider: z.object({
        // Name of the model provider to use
        // by default "auto" is used to select the best available provider
        model: z.string().default("auto"),
    }, "Must be a valid object"),
});

export type Config = z.infer<typeof configSchema>;

class ConfigManager {
    private config_path: string;
    private dirty: boolean = false;
    private config: Config = configSchema.parse({
        provider: {
            model: "auto",
        }
    });

    constructor() {
        this.config_path = path.join(os.homedir(), `.aicconfig.json`);
    }

    async sync() {
        if (this.dirty) {
            this.dirty = false;
            await fs.writeFile(this.config_path, JSON.stringify(this.config, null, 2));
        }
    }

    async load() {
        try {
            const data = await fs.readFile(this.config_path, 'utf-8');
            const parsed = JSON.parse(data);
            this.config = configSchema.parse(parsed);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                // this.config = configSchema.parse({});
                // ignore missing file error
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

        // Mark it as dirty for syncing
        this.dirty = true;
    }

    validate(): Array<String> | null {
        const result = configSchema.safeParse(this.config);
        if (!result.success) {
            return result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        }
        return null;
    }

    get(path: string): any {
        if(this.dirty) {
            throw new Error("Configuration has unsynced changes. Please sync before getting values.");
        }

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