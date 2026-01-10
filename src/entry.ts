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
  .command("[context]", "Generate commit message using AI")
  .option('-d, --debug', 'Disable commit generation and output AI generated reasoning')
  .action(runGenerateCommand);

// parse at the end
cli.help();
cli.version(pkgJson.version);

try {
  cli.parse();
}
catch (error) {
  if(error instanceof Error) {
    console.error("error:", error.message);
  }

  process.exitCode = 1;
}
