import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const DEFAULT_CONFIG_NAME = 'config.json';
const APP_DIR_NAME = 'aic-cli';

const defaultConfig = {
  apiKey: null,
  model: 'gemini-2.5-flash-lite',
  // short cut for using --auto flag
  commitGeneratedMessages: false,
}

export function getConfigDir() {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.length) return path.join(xdg, APP_DIR_NAME);
  // fallback to ~/.config
  return path.join(os.homedir(), '.config', APP_DIR_NAME);
}

export function getConfigPath() {
  return path.join(getConfigDir(), DEFAULT_CONFIG_NAME);
}

/**
 * Load the configuration from the config file.
 * @returns {Promise<Object>} The configuration object.
 */
export async function loadConfig() {
  const p = getConfigPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultConfig;
  }
}

export async function saveConfig(cfg) {
  const dir = getConfigDir();
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(getConfigPath(), JSON.stringify(cfg, null, 2), { mode: 0o600 });
    return true;
  } catch (err) {
    console.error('Failed to save config:', err.message || err);
    return false;
  }
}

export async function setApiKey(key) {
  const cfg = await loadConfig();
  cfg.apiKey = key;
  await saveConfig(cfg);
}

export async function getApiKey() {
  const cfg = await loadConfig();
  return cfg.apiKey;
}
