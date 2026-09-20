import { defineCommand } from "yalp-js";
import { blueBright } from "yoctocolors";
import add from "./add";
import keystore from "../../lib/keystore";

export default defineCommand({
  name: "key",
  commands: [add],
  description: "View Google API keys used by aic",
  action: async () => {
    const availableKeys = await keystore.getKeysFromKeyChain();
    console.log(`Keys available: [${availableKeys.length}]`)
    for (const { account, password } of availableKeys) {
      console.log(`   ${blueBright(account)} -> ${password}`)
    }
  },
});
