import { getApiKey, getConfigPath } from "../config.js";

function obuscureKey(key) {
  if (key.length <= 8) {
    return "*".repeat(key.length);
  }
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  const middle = "*".repeat(key.length - 8);
  return `${start}${middle}${end}`;
}

export default async function viewKeyCommand(options) {
  console.log("Here is your saved API key:");
  const configPath = getConfigPath();
  const key = await getApiKey();
  if (key) {
    console.log(obuscureKey(key));
  } else {
    console.log("No API key found in config.");
  }
  console.log(`(Config path: ${configPath})`);
}
