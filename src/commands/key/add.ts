import { defineCommand } from "yalp-js";
import { greenBright } from "yoctocolors";
import keystore from "../../lib/keystore";

export default defineCommand({
  name: "add",
  description: "Add a Google API key to be used for generating commit messages",
  positionals: { key: { required: true } },
  action: async ({ positionals }) => {
    const { key } = positionals;
    const savedName = await keystore.addToKeyChain(key);

    console.log(`API key saved as ${greenBright(savedName)}`);
  },
});
