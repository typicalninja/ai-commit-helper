#! /usr/bin/env node
import cac from "cac";
import pkgJson from "../package.json" with { type: "json" };  
import runGenerateCommand from "./commands/generate.ts";
import configHandlerCommand from "./commands/config.ts";

const cli = cac("ai-commit-helper");

cli
  .command("config [config-key] [config-value]", "Manage configuration settings")
  .action(configHandlerCommand);

cli
  .command("[...all]", "Run AI Commit Helper with provided arguments")
  .action(runGenerateCommand);

// parse at the end
cli.help();
cli.version(pkgJson.version);
cli.parse();
