---
name: theme-sync
description: Pull the latest BCI Brands Store Preview Theme from Shopify, review what changed, and commit the sync on a branch. Use when the user wants to sync the repo with the live store theme.
disable-model-invocation: true
---

Sync this repo with the store theme. The store is the source of truth pre-launch.

1. Ensure the working tree is clean (`git status`). If dirty, stop and tell the user — don't mix local edits into a sync commit.
2. Create a sync branch from up-to-date main:
   - `git checkout main && git pull`
   - `git checkout -b theme-sync/<YYYY-MM-DD>`
3. Pull the theme:
   - `shopify theme pull --store=fcfpai-08.myshopify.com --theme=146144592042`
   - If the CLI prompts for login, ask the user to run it themselves with `! shopify theme pull ...`.
4. Review changes: `git status --short` and `git diff --stat`. Summarize for the user — call out anything unexpected (deleted `bci-*` files, large diffs outside `config/settings_data.json`).
5. Commit everything on the branch: message `Sync theme from store <date>`. Do not push or open a PR unless the user asks.

Never run `shopify theme push` as part of this workflow.
