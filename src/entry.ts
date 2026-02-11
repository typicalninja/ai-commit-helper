#! /usr/bin/env node
import cac from "cac";
import pkgJson from "../package.json" with { type: "json" };
import runGenerateCommand from "./commands/generate.ts";
import { configCommand } from "./commands/config.ts";
import {
  addKeyCommand,
  removeKeyCommand,
  listKeysCommand,
} from "./commands/keys.ts";

const cli = cac("aic");

cli
  .command("config [key] [value]", "View or set configuration")
  .action(configCommand);

cli
  .command("add-key [provider] [key]", "Add an API key for a provider")
  .action(addKeyCommand);

cli
  .command("remove-key [provider]", "Remove an API key from a provider")
  .action(removeKeyCommand);

cli.command("list-keys", "List configured API keys").action(listKeysCommand);

cli
  .command("[...context]", "Generate a commit message")
  .action(runGenerateCommand);

cli.help();
cli.version(pkgJson.version);

try {
  cli.parse();
} catch (err) {
  if (err instanceof Error) {
    console.error(`error: ${err.message}`);
  }
  process.exitCode = 1;
}
