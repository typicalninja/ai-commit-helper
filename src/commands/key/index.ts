import { defineCommand } from "yalp-js";
import { blueBright } from "yoctocolors";
import keystore from "../../lib/keystore";
import add from "./add";
import remove from "./remove";

function maskKey(key: string): string {
  if (key.length <= 8) return "********";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

export default defineCommand({
  name: "key",
  commands: [add, remove],
  description: "View Google API keys used by aic",
  action: async () => {
    const availableKeys = await keystore.getKeysFromKeyChain();
    console.log(`keys available: [${availableKeys.length}]`);
    for (const { account, password } of availableKeys) {
      console.log(`   ${blueBright(account)} -> ${maskKey(password)}...`);
    }
  },
});
