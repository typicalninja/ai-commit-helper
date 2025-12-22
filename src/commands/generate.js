import { blue, bold, dim } from "yoctocolors";
import {
  commit,
  ensureInGitRepository,
  getCurrentBranchName,
  getStagedDiff,
  hasGitInstalled,
} from "../util/git.js";
import logger from "../util/logger.js";
import parseDiff from "parse-diff";
import { diffFileToString, getDiffSimplified } from "../util/diffs.js";
import { getApiKey } from "../util/config.js";
import { GoogleAIClient } from "../util/ai/gemini-flash.js";
import ora from "ora";
import { edit } from "@inquirer/external-editor";
import { askQuestion } from "../util/prompt.js";

const MAXIMUM_STAGED_FILES_TO_DISPLAY = 5;
// this is the safest for the AI model to handle and actually generate a good response
// based on testing and vibez : )
const MAX_CONTEXT_LENGTH = 15000; // adjust as needed

export default async function generateCommand(options) {
  const hasGit = await hasGitInstalled();
  if (!hasGit) {
    logger.error("Please install Git to use this command.");
    return 1;
  }

  const inGitRepo = await ensureInGitRepository();
  if (!inGitRepo) {
    logger.error("Please run this command inside a Git repository.");
    return 1;
  }

  const currentBranchName = await getCurrentBranchName();

  // get the actual diffs of the staged files
  const diffs = await getStagedDiff();
  if (!diffs || diffs.trim().length === 0) {
    logger.error("Please stage some changes before running this command.");
    return 1;
  }
  // we parse the diffs to get structured data
  // this will allow us to selectively analyze and process the diffs
  const parsedDiffs = parseDiff(diffs);

  // log the parsed diffs for each file
  const displayDiffSlice = parsedDiffs.slice(
    0,
    MAXIMUM_STAGED_FILES_TO_DISPLAY,
  );
  displayDiffSlice.forEach((fileDiff) => {
    logger.step(getDiffSimplified(fileDiff), "STAGE");
  });

  if (parsedDiffs.length > MAXIMUM_STAGED_FILES_TO_DISPLAY) {
    const remainingFiles = parsedDiffs.length - MAXIMUM_STAGED_FILES_TO_DISPLAY;
    logger.step(dim(`...and ${remainingFiles} more files.`), "STAGE");
  }

  // test
  const diffStrings = parsedDiffs.map((fileDiff) => diffFileToString(fileDiff));

  // send this to the model to generate the commit message
  // information to make available to the model:
  // - current branch name - done
  // - staged diffs (as text) - done
  // - previous commit messages (optional, can be fetched inside the function)
  // - user-provided context (optional)

  let userContext = "";
  if (
    options.context &&
    typeof options.context === "string" &&
    options.context.trim().length > 0
  ) {
    userContext = options.context.trim();
  }

  const aiContext = {
    currentBranchName,
    stagedDiffs: diffStrings,
    userContext,
  };

  const aiContextString = convertAiContextToString(aiContext);
  // check for warning length, since if the diffs are too large, the model may not be able to handle it
  const aiContextLength = aiContextString.length;
  if (aiContextLength > MAX_CONTEXT_LENGTH) {
    logger.warn(
      `The staged changes are quite large (${aiContextLength} characters). The generated commit message may be incomplete or inaccurate.`,
    );
  }

  // temporary for now until we make it modular
  const apiKey = await getApiKey();

  const aiModel = new GoogleAIClient(apiKey);
  const spinner = ora("Generating commit message...").start();
  const commitMessage =
    options.ai === false
      ? `TEST COMMIT MESSAGE GENERATED FOR STAGED CHANGES`
      : await aiModel.generateCommitMessage(aiContextString);
  //const commitMessage = `TEST COMMIT MESSAGE GENERATED FOR STAGED CHANGES`;
  spinner.stop();
  let finalMessage = commitMessage.trim();

  // check if empty
  if (finalMessage.length === 0) {
    logger.error("Failed to generate a commit message.");
    return 1;
  }

  // start the next menu
  let exitMenu = false;

  while (!exitMenu) {
    console.clear();
    console.log(dim("-".repeat(50)));
    displayStagedDiffsSummary(
      displayDiffSlice,
      parsedDiffs.length - displayDiffSlice.length,
    );
    console.log(`\n${finalMessage}\n`);
    const dimSeparator = dim("/");
    console.log(
      `${bold("COMMANDS")}: [c]ommit ${dimSeparator} [e]dit ${dimSeparator} [a]bort`,
    );
    const answer = await askQuestion(`${bold(blue("What now"))}> `);
    const action = answer.trim().toLowerCase().charAt(0);

    switch (action) {
      case "c":
        // perform the commit
        exitMenu = true;
        // commit staged files with the finalMessage
        await commit(finalMessage);
        console.log("Done!");
        break;
      case "e": {
        // open editor to edit the message
        const editedMessage = edit(finalMessage);
        if (editedMessage && editedMessage.trim().length > 0) {
          // use the edited message
          finalMessage = editedMessage.trim();
          logger.info("Commit message updated.");
        } else {
          logger.warn("Edited message is empty. Keeping the original message.");
        }
        break;
      }
      case "d":
        edit(aiContextString);
        break;
      case "a":
        exitMenu = true;
        console.log("Bye!");
        break;
      default:
        logger.warn("Invalid option. Please choose 'c', 'e', or 'a'.");
        break;
    }
  }

  return 0;
}

function displayStagedDiffsSummary(diffs, remaining = 0) {
  diffs.forEach((fileDiff) => {
    logger.step(getDiffSimplified(fileDiff), "STAGE");
  });

  if (remaining > 0) {
    logger.step(dim(`...and ${remaining} more diffs.`), "STAGE");
  }
}

// Few-Shot Examples for the AI model
const AI_USER_PROMPT = `[BEGIN OF EXAMPLES]
Examples of correct commit messages:
Case 1: Adding dependency without other changes
- File: package.json
Commit: chore: add lodash as a project dependency
Case 2: Fixing a bug in user authentication
- File: auth.js
- File: userController.js
Commit: fix: resolve user authentication issue on login
Case 3: Updating documentation
- File: README.md
Commit: docs: update installation instructions in README
Case 4: Refactoring code within a certain obvious group of files
- File: utils.js
- File: helpers.js
Commit: refactor(utils): improve code structure in utility functions
Case 5: Implementing a new feature with detailed changes
- File: feature.js
- File: featureDisplay.js
Commit: feat: add user profile feature with tests

Implemented a new user profile feature allowing users to view and edit their profiles.
[/END OF EXAMPLES]

Now generate a **single valid Conventional Commit message** for the staged changes above.
Output only the commit message.`;

/**
 * Convert AI context inputs into a string.
 * @param {Object} context
 * @param {string} context.currentBranchName
 * @param {Array<string>} context.recentCommits
 * @param {Array<string>} context.stagedDiffs
 * @param {string} [context.userContext]
 * @returns {string}
 */
function convertAiContextToString(context) {
  let out = `1. Current Branch: ${context.currentBranchName}\n`;
  if (context.stagedDiffs && context.stagedDiffs.length > 0) {
    out += `3. Staged Changes:\n`;
    context.stagedDiffs.forEach((diff, index) => {
      out += `[${index + 1}] ${diff}\n`;
    });
  }

  if (context.userContext && context.userContext.trim().length > 0) {
    out += `4. Additional Context:\n${context.userContext}\n\n`;
  }

  return out + AI_USER_PROMPT;
}
