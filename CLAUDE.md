# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopify theme for the BCI Brands store — a **Dawn 15.4.1** derivative pulled from theme `146144592042` on `fcfpai-08.myshopify.com`. Pre-launch: this repo mirrors the store; we take ownership of the code after launch.

## Hard rules

- **Do NOT run `shopify theme push`.** Pre-launch, the store team owns the live theme. Pushing is a deliberate, user-initiated act only.
- **`config/settings_data.json` is generated live-store state, not source code.** On any conflict, the store wins — re-pull rather than hand-merge. Don't hand-edit it to change behavior; that belongs in theme code or the theme editor.
- Don't edit stock locale files. Only `locales/en.default.json` and `en.default.schema.json` carry our custom strings; the other ~49 locale files are stock Dawn.

## Conventions

- Custom code is namespaced with the `bci-` prefix: `assets/bci-*.js`, `sections/bci-*.liquid`, `templates/collection.bci-*.json`. Overridden Dawn main sections use `main-bci-*` (e.g. `sections/main-bci-collection-product-grid.liquid`). Everything else is stock Dawn 15.4.1 — keep it unmodified where possible so base-theme upgrades stay tractable. New custom files follow the same prefix.
- Git: feature branches + PRs into `main` on `BCI-Brands/BCI-shopify-theme`. No direct commits to main.
- Sync workflow: `shopify theme pull --store=fcfpai-08.myshopify.com --theme=146144592042` before starting work (or use `/theme-sync`).

## Tooling

- No build step, no package.json. Pure Shopify CLI + Liquid.
- Validate with `shopify theme check`. `.theme-check.yml` baselines pre-existing offenses from the pulled theme, so any error it reports is new — fix it. Takes ~17s (full-theme scan; single-file checks unsupported).
- Repo lives on OneDrive — if git or Shopify CLI file operations behave oddly (locks, stale reads), suspect OneDrive sync.
