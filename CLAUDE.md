# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopify theme for the BCI Brands store — a **Dawn 15.4.1** derivative pulled from theme `146144592042` on `fcfpai-08.myshopify.com`. Pre-launch: this repo mirrors the store; we take ownership of the code after launch.

## Hard rules

- **Do NOT run `shopify theme push` against a live/published theme.** Pre-launch, the store team owns the live theme. The only allowed pushes are `--unpublished` (or an explicit `--theme <staging-id>`) to the dev store, and even those are deliberate, user-initiated acts.
- **`config/settings_data.json` is generated live-store state, not source code.** On any conflict, the store wins — re-pull rather than hand-merge. Don't hand-edit it to change behavior; that belongs in theme code or the theme editor.
- Don't edit stock locale files. Only `locales/en.default.json` and `en.default.schema.json` carry our custom strings; the other ~49 locale files are stock Dawn.

## Conventions

- Custom code is namespaced with the `bci-` prefix: `assets/bci-*.js`, `sections/bci-*.liquid`, `templates/collection.bci-*.json`. Overridden Dawn main sections use `main-bci-*` (e.g. `sections/main-bci-collection-product-grid.liquid`). Everything else is stock Dawn 15.4.1 — keep it unmodified where possible so base-theme upgrades stay tractable. New custom files follow the same prefix.
- Git: trunk-based — `main` is always deployable. Short-lived feature branches + PRs into `main` on `BCI-Brands/BCI-shopify-theme`. No direct commits to main. Conventional commits (feat:, fix:, chore:, refactor:).
- Sync workflow: `shopify theme pull --store=fcfpai-08.myshopify.com --theme=146144592042` before starting work (or use `/theme-sync`).

## Tooling

- No build step, no package.json. Pure Shopify CLI + Liquid.
- Validate with `shopify theme check`. `.theme-check.yml` baselines pre-existing offenses from the pulled theme, so any error it reports is new — fix it. Takes ~17s (full-theme scan; single-file checks unsupported).
- Repo lives on OneDrive — if git or Shopify CLI file operations behave oddly (locks, stale reads), suspect OneDrive sync.

## Stores

- Dev: `bcibrands-devstore.myshopify.com` — all `theme dev` / `theme push --unpublished` work goes here.
- Production: `bcibrandsstore.myshopify.com` — never push here.
- Theme source (pre-launch mirror): `fcfpai-08.myshopify.com`, theme `146144592042` — pull only.

## Rules

- Always validate generated Liquid with validate_theme_codeblocks before writing files.
- Run `shopify theme check` after any refactor and fix all violations.
- Never run `shopify theme push` without `--unpublished` or an explicit `--theme <staging-id>`, and only against the dev store (see Hard rules).
- Never run `shopify store execute --allow-mutations` against production. Dev store only.
- Preserve existing block types and schema presets when modifying sections.
- All new sections require: schema with name + presets, LiquidDoc header, translations in locales/en.default.json.
- One section per PR for anything touching PDP or checkout-adjacent templates.

## Commands

- shopify theme dev --store bcibrands-devstore.myshopify.com    # local hot-reload preview
- shopify theme check                                            # lint Liquid/JSON/schema
- shopify theme push --unpublished --store bcibrands-devstore.myshopify.com   # deploy to a new unpublished theme
- shopify theme list --store bcibrands-devstore.myshopify.com    # find theme IDs
