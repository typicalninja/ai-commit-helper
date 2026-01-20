import { execa } from "execa";

// Low level git command execution
export async function executeGit(args: string[], execaOptions?: Record<string, any>) {
    const result = await execa("git", args, execaOptions);
    return result;
}

/**
 * Returns true the current directory (or given path) is inside a git repository
 * @param repoPath 
 * @returns 
 */
export async function isInGitRepository(): Promise<boolean> {
    try {
        await executeGit(["rev-parse", "--is-inside-work-tree"]);
        return true;
    } catch {
        return false;
    }
}

export async function getStagedDiffs() {
    const { stdout } = await executeGit(["diff", "--cached"]);
    // for some reason stdout can be undefined
    if(!stdout) {
        return "";
    }

    return stdout as string;
}

export function commitStaged(message: string) {
    return executeGit(["commit", "-m", message], {
        stdio: "inherit"
    });
}