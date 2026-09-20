import { defineCommand } from "yalp-js";
import { loadConfig, saveConfig } from "../lib/config.js";

const modelChoices = [
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

export default defineCommand({
  name: "model",
  description: "Set the LLM model used by aic to generate commits.",
  positionals: { identifier: { choices: modelChoices } },
  action: async ({ positionals }) => {
    const config = await loadConfig();
    const identifier = positionals.identifier;

    if (!identifier) return console.log(`Active model is "${config.model}"`);

    config.model = identifier;
    await saveConfig(config);
  },
});
