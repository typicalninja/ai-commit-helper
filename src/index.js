#! /usr/bin/env node
import { program } from "commander";
import setKeyCommand from "./commands/set-key.js";
import viewKeyCommand from "./commands/view-key.js";
import generateCommand from "./commands/generate.js";

program
  .name("aic")
  .description("AI commit helper using Google Gemini")
  .version("0.1.0");

program
  .command("set-key")
  .description("Save Gemini API key to config")
  .option("-k, --key <key>", "API key or bearer token")
  .action(setKeyCommand);

program
  .command("view-key")
  .description("View saved Gemini API key from config")
  .action(viewKeyCommand);


program
    .command("generate")
    .description("Generate a commit message")
    .option("-a, --auto", "Automatically commit the generated message without prompting")
    .action(generateCommand);

program.parseAsync(process.argv);
