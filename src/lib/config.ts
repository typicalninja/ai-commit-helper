import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { z } from "zod";

const configSchema = z.object({
  model: z.string().default("gemini-2.5-flash-lite"),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(os.homedir(), ".config", "aic");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

let configCache: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (configCache) return Promise.resolve(configCache);

  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    configCache = configSchema.parse(JSON.parse(data));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    // parse on empty object, give us the default values
    configCache = configSchema.parse({});
  }

  return configCache;
}

export async function saveConfig(config: Config): Promise<void> {
  configSchema.parse(config);
  // update the cache
  configCache = config;

  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}
