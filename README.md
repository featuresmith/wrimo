# Wrimo – Write more!

The global writing challenge where the reward is your own book.

## Overview

Wrimo is a statically generated site served by a Cloudflare Worker. The UI is built with Vite, and the Worker streams the built assets that live in Cloudflare's Worker asset storage. GitHub Actions uses Wrangler to publish the production Worker, while Spacelift applies the OpenTofu stack that provisions the Worker shell, secrets, and custom domains in Cloudflare.

## Development

The site is a simple static HTML page. To work on it locally:

1. Clone the repository
2. Install development tools using [mise](https://mise.jdx.dev/):
   ```bash
   mise install
   ```
   This will install the required Node.js version specified in `.mise.toml`
3. Install project dependencies:
   ```bash
   mise run install
   ```
4. Edit `index.html` as needed
5. Start the development server:
   ```bash
   mise run dev
   ```
6. Open http://localhost:5173 in your browser

### Preview the Worker locally

To validate the Worker runtime locally, build the production assets and run Wrangler's dev server against the Worker:

```bash
pnpm build
npx wrangler dev --assets dist
```

This serves the Worker at http://localhost:8787 using the same bundle the deployment workflow will upload.

## Deployment

Deployments are automated via GitHub Actions. Pushing to `main` triggers the Wrangler workflow (`.github/workflows/infra.yml`), which runs `pnpm build` followed by `npx wrangler deploy --assets dist` to publish the Worker and its static assets to Cloudflare.

### Wrangler workflow and manifest

The repository includes a `wrangler.toml` manifest so Wrangler can deploy the Worker and upload the static build output (`dist/`) as Worker assets. Wrangler reads the account identifier from the `CLOUDFLARE_ACCOUNT_ID` environment variable, so export it locally (for example `export CLOUDFLARE_ACCOUNT_ID=...`) or configure it in CI before running `pnpm wrangler ...` commands.

### Required GitHub Secrets

To enable automated deployments, configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` – Cloudflare API token Wrangler uses to publish the Worker and upload assets
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions:
    - Account → Workers Scripts → Edit
    - Account → Workers KV Storage → Edit (required for Worker assets)
    - Account → Workers Routes → Edit (needed if Wrangler manages service bindings)
- `CLOUDFLARE_ACCOUNT_ID` – Your Cloudflare account ID
  - Find in: Cloudflare Dashboard → Any site → Overview (in the right sidebar)

### GitHub Environment Setup

The deployment workflow uses a `Production` environment for additional protection:

1. Go to Settings → Environments → New environment
2. Create an environment named `Production`
3. (Optional) Add protection rules like required reviewers

## Infrastructure

Infrastructure is managed via OpenTofu in the `infra/` directory and executed through Spacelift. Spacelift owns the state backend and applies the Worker resources (script shell, secrets, and domain bindings) whenever infrastructure changes are merged.

### Setup

1. Copy the example variables file:
   ```bash
   cd infra
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your actual values:
   - `cloudflare_account_id` - Your Cloudflare account ID
   - `cloudflare_api_token` - API token with appropriate permissions
   - `custom_domain_default_zone` - (Optional) Default zone name to apply when hostnames omit zone details
   - `custom_domains` - Custom domains keyed by hostname or provided as a list of hostnames/objects (set to `{}`, `[]`, or `null` if none)
     - When supplying a list of hostnames, set `custom_domain_default_zone` to your apex zone (for example `wrimo.io`). Use the map form when you need per-host zone IDs or environments.

3. Initialize and apply:
   ```bash
   mise run tf-init
   mise run tf-plan
   mise run tf-apply
   ```

### State Management

OpenTofu state is automatically managed by Spacelift. No backend configuration is needed in `providers.tf` as Spacelift handles state storage in its managed backend.

### Spacelift automation

Spacelift runs the OpenTofu stack whenever infrastructure changes are merged to `main`, applying updates to the Worker script container, secrets, and custom domain bindings. Local runs (`mise run tf-plan` / `mise run tf-apply`) remain useful for validation, but the production lifecycle is driven by Spacelift.

## Contributing

Consult [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## License

TBD
