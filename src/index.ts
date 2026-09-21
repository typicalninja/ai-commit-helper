import { defineCommand, run } from "yalp-js";
import pkgJson from "../package.json" with { type: "json" };
import { commands } from "./commands";
import generateCommandAction from "./commands/generate";

const aic = defineCommand({
  name: "aic",
  commands: commands,
  positionals: {
    context: {},
  },
  action: ({ positionals }) => generateCommandAction(positionals.context),
});

await run(aic, {
  version: pkgJson.version,
});
