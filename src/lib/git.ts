import { execa } from "execa";

const execGit = (...args: string[]) => execa("git", args);

// Lock files, build output and generated code: huge, low signal, and the model just parrots them.
const NOISE_GLOBS = [
  // js/ts
  "**/pnpm-lock.yaml", "**/package-lock.json", "**/npm-shrinkwrap.json", "**/yarn.lock", "**/bun.lock", "**/bun.lockb", "**/deno.lock",
  "**/*.min.js", "**/*.min.css", "**/*.map", "**/dist/**", "**/build/**", "**/.next/**", "**/coverage/**", "**/*.tsbuildinfo",
  // rust
  "**/Cargo.lock", "**/target/**",
  // dart/flutter (build_runner and gen-l10n output)
  "**/pubspec.lock", "**/*.g.dart", "**/*.freezed.dart", "**/*.gr.dart", "**/*.mocks.dart", "**/*.chopper.dart",
  "**/injection.config.dart", "**/app_localizations*.dart", "**/generated_plugin_registrant.dart",
  "**/.dart_tool/**", "**/.flutter-plugins", "**/.flutter-plugins-dependencies", "**/Podfile.lock", "**/GeneratedPluginRegistrant.*",
];

// ponytail: chars, not tokens; per-file cap only, no total cap. Add a total budget if huge multi-file commits hurt.
const MAX_FILE_CHARS = 6000;

const truncateFiles = (diff: string) =>
  diff
    .split(/^(?=diff --git )/m)
    .map((file) => {
      if (file.length <= MAX_FILE_CHARS) return file;
      const cut = file.lastIndexOf("\n", MAX_FILE_CHARS);
      return `${file.slice(0, cut)}\n[... ${file.length - cut} more chars of this file's diff omitted]\n`;
    })
    .join("");

/**
 * Get the diff for the staged files in the current repository.
 * Lock and generated files are left out of the diff and listed by size at the end,
 * so a lockfile-only commit still yields something to describe.
 */
export async function getStagedDiffs() {
  const noise = NOISE_GLOBS.map((g) => `:(top,glob)${g}`);
  const exclude = NOISE_GLOBS.map((g) => `:(top,exclude,glob)${g}`);
  const [{ stdout: diff }, { stdout: omitted }] = await Promise.all([
    execGit("diff", "--cached", "--", ":/", ...exclude),
    execGit("diff", "--cached", "--numstat", "--", ...noise),
  ]);
  const kept = truncateFiles(diff);
  return omitted.trim()
    ? `${kept}\n[omitted lock/generated files, as "added removed path"]\n${omitted}\n`
    : kept;
}

/**
 * Per-file change summary of everything staged, including files omitted from the diff sent to the model.
 */
export async function getStagedStat() {
  const { stdout } = await execGit("diff", "--cached", "--stat=72");
  return stdout.toString().trim();
}

/**
 * Commit the currently staged files with the given message.
 * With `edit`, git opens the user's editor prefilled with the message (like `git commit -e`).
 */
export async function commitStaged(message: string, edit = false) {
  if (edit) {
    // git prints its own abort/hook errors on the inherited stdio, so don't throw
    await execa("git", ["commit", "-e", "-m", message], { stdio: "inherit", reject: false });
    return "";
  }
  const { stdout } = await execGit("commit", "-m", message);
  return stdout.toString();
}
