import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { z } from "zod";

const providerConfigSchema = z.object({
  baseUrl: z.string().optional(),
});

const configSchema = z.object({
  provider: z.string().default("gemini"),
  model: z.string().default("gemini-2.5-flash-lite"),
  ignore: z
    .array(z.string())
    .default([
      "*.lock",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      "bun.lock",
      "bun.lockb",
    ]),
  maxDiffLines: z.number().default(500),
  providers: z.record(z.string(), providerConfigSchema).default({}),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(os.homedir(), ".config", "aic");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return configSchema.parse(JSON.parse(data));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return configSchema.parse({});
    }
    throw error;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export function setConfigValue(
  config: Config,
  keyPath: string,
  value: string,
): Config {
  const clone = structuredClone(config);
  const keys = keyPath.split(".");
  let current: Record<string, unknown> = clone as unknown as Record<
    string,
    unknown
  >;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof current[k] !== "object" || current[k] === null) {
      current[k] = {};
    }
    current = current[k] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];

  if (value === "true") current[lastKey] = true;
  else if (value === "false") current[lastKey] = false;
  else if (/^\d+$/.test(value)) current[lastKey] = Number.parseInt(value, 10);
  else current[lastKey] = value;

  return configSchema.parse(clone);
}

export function getConfigValue(config: Config, keyPath: string): unknown {
  const keys = keyPath.split(".");
  let current: unknown = config;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function flattenConfig(config: Config): string[] {
  const result: string[] = [];

  function walk(obj: unknown, prefix: string) {
    if (obj === null || obj === undefined) return;
    if (Array.isArray(obj)) {
      result.push(`${prefix}=${JSON.stringify(obj)}`);
      return;
    }
    if (typeof obj === "object") {
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        walk(value, prefix ? `${prefix}.${key}` : key);
      }
      return;
    }
    result.push(`${prefix}=${obj}`);
  }

  walk(config, "");
  return result;
}

export function resetConfig(): Config {
  return configSchema.parse({});
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
