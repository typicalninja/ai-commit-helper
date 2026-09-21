import { defineCommand } from "yalp-js";
import { blueBright } from "yoctocolors";
import keystore from "../../lib/keystore";
import add from "./add";
import remove from "./remove";

export default defineCommand({
  name: "key",
  commands: [add, remove],
  description: "View Google API keys used by aic",
  action: async () => {
    const availableKeys = await keystore.getKeysFromKeyChain();
    console.log(`keys available: [${availableKeys.length}]`);
    for (const { account, password } of availableKeys) {
      console.log(`   ${blueBright(account)} -> ${password.substring(0, 7)}...`);
    }
  },
});
