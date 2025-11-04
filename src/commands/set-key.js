import {
  setApiKey,
} from "../util/config.js";
import { intro, outro, text, isCancel } from "@clack/prompts";

export default async function setKeyCommand(options) {
  intro("Set API Key");

  let key = options.key;

  if (!key) {
    // Interactive prompt
    key = await text({
      message: "What is your API key?",
      placeholder: "Not sure",
      validate(value) {
        if (value.length === 0) return `Value is required!`;
      },
    });

    if (isCancel(key)) {
      outro("Operation cancelled.");
      return;
    }
  }

  await setApiKey(key);
  outro("API key saved successfully.");
}
