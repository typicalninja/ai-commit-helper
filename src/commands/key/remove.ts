import { defineCommand } from "yalp-js";
import { blueBright, redBright } from "yoctocolors";
import keystore from "../../lib/keystore";

export default defineCommand({
  name: "remove",
  alias: ["r"],
  description: "Remove a Google API key from being used for generating commit messages",
  positionals: { key: { required: true } },
  action: async ({ positionals }) => {
    const { key } = positionals;
    const deleteStatus = await keystore.deleteKeyFromKeyChain(key);

    if (deleteStatus) {
      console.log(`deleted the key ${blueBright(key)}.`);
    } else {
      console.error(`failed to delete the key ${redBright(key)}.`);
    }
  },
});
