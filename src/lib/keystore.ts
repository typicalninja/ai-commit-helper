import keytar from "keytar";

const SERVICE = "aic-cli";

function accountName(provider: string): string {
  return `aic-${provider}`;
}

async function keychainGet(provider: string): Promise<string | null> {
  return keytar.getPassword(SERVICE, accountName(provider));
}

async function keychainSet(provider: string, value: string): Promise<void> {
  await keytar.setPassword(SERVICE, accountName(provider), value);
}

async function keychainDelete(provider: string): Promise<void> {
  await keytar.deletePassword(SERVICE, accountName(provider));
}

export async function getKeys(provider: string): Promise<string[]> {
  const raw = await keychainGet(provider);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function addKey(
  provider: string,
  key: string,
): Promise<string[]> {
  const keys = await getKeys(provider);
  keys.push(key);
  await keychainSet(provider, JSON.stringify(keys));
  return keys;
}

export async function removeKey(
  provider: string,
  index: number,
): Promise<string[]> {
  const keys = await getKeys(provider);
  if (index < 0 || index >= keys.length) return keys;
  keys.splice(index, 1);
  if (keys.length === 0) {
    await keychainDelete(provider);
  } else {
    await keychainSet(provider, JSON.stringify(keys));
  }
  return keys;
}
