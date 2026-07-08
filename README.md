# BCI Shopify Theme

Shopify theme for the BCI Brands store. Pulled from **BCI Brands Store Preview Theme** (theme ID `146144592042`) on `fcfpai-08.myshopify.com`.

## Structure

Standard Shopify theme layout:

| Directory | Contents |
|-----------|----------|
| `assets/` | CSS, JavaScript, and static assets |
| `config/` | Theme settings schema and data |
| `layout/` | Theme layout files (`theme.liquid`, `password.liquid`) |
| `locales/` | Translation files |
| `sections/` | Reusable page sections |
| `snippets/` | Reusable Liquid partials |
| `templates/` | JSON templates mapping pages to sections |

## Development

Requires the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli).

```sh
# Log in and start a local dev preview
shopify theme dev --store=fcfpai-08.myshopify.com

# Pull latest changes from the live theme
shopify theme pull --store=fcfpai-08.myshopify.com --theme=146144592042

# Push local changes to the theme
shopify theme push --store=fcfpai-08.myshopify.com --theme=146144592042
```

## Workflow

1. Pull the latest theme before making changes.
2. Edit locally and preview with `shopify theme dev`.
3. Commit changes to this repo, then push to the store.
