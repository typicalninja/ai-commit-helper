import { execa } from "execa";

// Low level git command execution
export async function executeGit(args: string[], repoPath?: string): Promise<string> {
    const options = repoPath ? { cwd: repoPath } : {};
    const result = await execa("git", args, options);
    return result.stdout.trim();
}

/**
 * Returns true the current directory (or given path) is inside a git repository
 * @param repoPath 
 * @returns 
 */
export async function isInGitRepository(repoPath?: string): Promise<boolean> {
    try {
        await executeGit(["rev-parse", "--is-inside-work-tree"], repoPath);
        return true;
    } catch {
        return false;
    }
}

export function getStagedDiffs() {
    return executeGit(["diff", "--cached"]);
}

export function commitStaged(message: string) {
    return executeGit(["commit", "-m", message]);
}