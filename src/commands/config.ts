import {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  flattenConfig,
  resetConfig,
  getConfigPath,
} from "../lib/config.ts";
import { error } from "../ui/format.ts";
import { cyan, dim, green } from "yoctocolors";

export async function configCommand(key?: string, value?: string) {
  const config = await loadConfig();

  if (!key) {
    console.log(dim(getConfigPath()) + "\n");
    for (const line of flattenConfig(config)) {
      console.log(line);
    }
    return;
  }

  if (key === "reset") {
    await saveConfig(resetConfig());
    console.log(green("config reset to defaults"));
    return;
  }

  if (value === undefined) {
    const val = getConfigValue(config, key);
    if (val === undefined) {
      console.error(error(`key ${cyan(key)} not found`));
      process.exitCode = 1;
      return;
    }
    console.log(
      typeof val === "object" ? JSON.stringify(val, null, 2) : String(val),
    );
    return;
  }

  try {
    const updated = setConfigValue(config, key, value);
    await saveConfig(updated);
    console.log(`${cyan(key)} ${green("->")} ${value}`);
  } catch (err) {
    console.error(error((err as Error).message));
    process.exitCode = 1;
  }
}
