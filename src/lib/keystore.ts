import keytar from "keytar";
import crypto from "node:crypto";

const SERVICE_NAME = "aic-cli";

const sha256 = (str: string) => crypto.createHash("sha256").update(str).digest("hex");

/**
 * Add the provided value to the device keychain.
 * Uses the first 8 letters of the hash of the value as keychain account.
 */
async function addToKeyChain(value: string): Promise<string> {
  // get the first 8 characters after hashing the value
  const accountName = sha256(value).substring(0, 8);
  await keytar.setPassword(SERVICE_NAME, accountName, value);
  return accountName;
}

/**
 * Get the list of saved keys from the keychain
 */
async function getKeysFromKeyChain() {
  return await keytar.findCredentials(SERVICE_NAME);
}

/**
 * Remove the specified account/API key from the keychain.
 */
async function deleteKeyFromKeyChain(accountName: string): Promise<boolean> {
  return await keytar.deletePassword(SERVICE_NAME, accountName);
}

export default { addToKeyChain, getKeysFromKeyChain, deleteKeyFromKeyChain };
