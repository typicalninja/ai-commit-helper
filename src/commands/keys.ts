import { loadConfig } from "../lib/config.ts";
import * as keystore from "../lib/keystore.ts";
import { listProviders, providerNames } from "../providers/resolver.ts";
import { maskKey, error } from "../ui/format.ts";
import { bold, cyan, dim, green, red } from "yoctocolors";
import { select, input } from "@inquirer/prompts";

async function pickProvider(message: string): Promise<string> {
  return select({
    message,
    choices: providerNames().map((name) => ({ name, value: name })),
  });
}

async function getKeyInput(provider: string): Promise<string> {
  return input({
    message: `API key for ${provider}`,
    validate: (v) => (v.length > 0 ? true : "key cannot be empty"),
  });
}

export async function addKeyCommand(provider?: string, key?: string) {
  const name = provider || (await pickProvider("Provider"));
  const apiKey = key || (await getKeyInput(name));

  const keys = await keystore.addKey(name, apiKey);
  console.log(`${green("+")} key added to ${cyan(name)} (${keys.length} total)`);
}

export async function removeKeyCommand(provider?: string) {
  const name = provider || (await pickProvider("Remove key from"));
  const keys = await keystore.getKeys(name);

  if (keys.length === 0) {
    console.error(error(`no keys configured for ${cyan(name)}`));
    process.exitCode = 1;
    return;
  }

  const index = await select({
    message: `Remove key from ${name}`,
    choices: keys.map((k, i) => ({
      name: `${i + 1}. ${maskKey(k)}`,
      value: i,
    })),
  });

  await keystore.removeKey(name, index);
  console.log(`${red("-")} key removed from ${cyan(name)}`);
}

export async function listKeysCommand() {
  const config = await loadConfig();
  const all = listProviders();
  let hasKeys = false;

  for (const provider of all) {
    const keys = await keystore.getKeys(provider.name);
    if (keys.length === 0) continue;

    hasKeys = true;
    const active = config.provider === provider.name ? green(" (active)") : "";
    console.log(`\n${bold(provider.name)}${active}`);

    for (let i = 0; i < keys.length; i++) {
      console.log(`  ${dim(`${i + 1}.`)} ${maskKey(keys[i])}`);
    }
  }

  if (!hasKeys) {
    console.log(
      dim("no keys configured. Add one with: aic add-key <provider> <key>"),
    );
  }
  console.log();
}
