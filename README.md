# aic-commit-helper

A small Node.js CLI to help generate git commit messages using Google Gemini. It's configurable, supports saving an API key, and lets you choose the model. The default model is the cheapest Gemini `flash` model.

Quick start

1. Install (pnpm):

```bash
pnpm install
pnpm -w link # (optional global linking) or run via `pnpm start`
```

2. Set your Gemini API key (persisted in your config directory):

```bash
# interactive
aic set-key

# or one-shot
aic set-key --key "YOUR_KEY_HERE"
```

3. Generate a commit message from staged changes:

```bash
# generate message to stdout
aic generate

# generate using a specific model
aic generate --model=gpt-4o-mini

# generate and commit automatically
aic commit --amend
```

Notes & assumptions

- This tool saves a small config file in `$XDG_CONFIG_HOME/aic-cli/config.json` or `~/.config/aic-cli/config.json` on macOS.
- The Gemini API calling code supports both API keys and bearer tokens; see README for details.

Security

For now the API key is stored in a plain JSON file in your config directory. If you want a more secure store (OS keyring), we can add that later.

License: MIT
