import { dim } from "yoctocolors";
import { ensureInGitRepository, getCurrentBranchName, getRecentCommits, getStagedDiff, getStagedFiles, hasGitInstalled } from "../util/git.js";
import logger from "../util/logger.js";
import parseDiff from "parse-diff";
import { diffFileToString, getDiffSimplified } from "../util/diffs.js";
import truncate from "lodash.truncate";
import { getApiKey } from "../util/config.js";
import { GoogleAIClient } from "../util/ai/gemini-flash.js";
import ora from 'ora';


const MAXIMUM_STAGED_FILES_TO_DISPLAY = 5;
// this is the safest for the AI model to handle and actually generate a good response
// based on testing and vibez : )
const MAX_CONTEXT_LENGTH = 15000; // adjust as needed


export default async function generateCommand(options) {
    const hasGit = await hasGitInstalled();
    if (!hasGit) {
        logger.error(
            "Please install Git to use this command.",
        );
        return 1;
    }

    const inGitRepo = await ensureInGitRepository();
    if (!inGitRepo) {
        logger.error(
            "Please run this command inside a Git repository.",
        );
        return 1;
    }

    const currentBranchName = await getCurrentBranchName();

    // get the actual diffs of the staged files
    const diffs = await getStagedDiff()
    if(!diffs || diffs.trim().length === 0) {
        logger.error(
            "Please stage some changes before running this command.",
        );
        return 1;
    }
    // we parse the diffs to get structured data
    // this will allow us to selectively analyze and process the diffs
    const parsedDiffs = parseDiff(diffs);
    
    // log the parsed diffs for each file
    const displayDiffSlice = parsedDiffs.slice(0, MAXIMUM_STAGED_FILES_TO_DISPLAY);
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
    const contextCommits = (await getRecentCommits(3)).map((commit) => truncate(commit.subject, { length: 50 }));
    contextCommits.forEach((commit, index) => {
        logger.step(`[${index + 1}] ${commit}`, "PREVC");
    });

    let userContext = "";
    if (options.context && typeof options.context === "string" && options.context.trim().length > 0) {
        userContext = options.context.trim();
    }

    const aiContext = {
        currentBranchName,
        recentCommits: contextCommits,
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
    console.log("");
    const spinner = ora('Generating commit message...').start();
    const commitMessage = await aiModel.generateCommitMessage(aiContextString)
    spinner.stop();
    const finalMessage = commitMessage.trim();
    console.log("\nGenerated Commit Message:\n");
    console.log(finalMessage);
    console.log("");

    return 0;
}

// Few-Shot Examples for the AI model
const AI_USER_PROMPT = `
Examples of correct commit messages:

feat(auth): add OAuth2 login support
Implement OAuth2 authentication for login flow.

fix(auth): reject empty password submissions

chore(deps): upgrade axios to 1.5.0

docs(readme): clarify environment setup instructions
Update README to include steps for local environment setup.

refactor(api): simplify response serialization

Now generate a **single valid Conventional Commit message** for the staged changes above. Output only the commit message.
`


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
    let out = `Current Branch: ${context.currentBranchName}\n\n`;

    if (context.recentCommits && context.recentCommits.length > 0) {
        out += `Recent Commits:\n`;
        context.recentCommits.forEach((commit, index) => {
            out += `[${index + 1}] ${commit}\n`;
        });
        out += `\n`;
    }

    if (context.stagedDiffs && context.stagedDiffs.length > 0) {
        out += `Staged Changes:\n`;
        context.stagedDiffs.forEach((diff, index) => {
            out += `--- File ${index + 1} ---\n`;
            out += `${diff}\n`;
        });
        out += `\n`;
    }

    if (context.userContext && context.userContext.trim().length > 0) {
        out += `Additional Context:\n${context.userContext}\n\n`;
    }

    return out + AI_USER_PROMPT;
}