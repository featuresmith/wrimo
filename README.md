# Wrimo – Write more!

The global writing challenge where the reward is your own book.

## Overview

Wrimo is a simple static HTML site deployed to Cloudflare Pages. The infrastructure is managed via Terraform, and deployments are automated through GitHub Actions.

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

## Deployment

Deployments are automated via GitHub Actions. When you push to `main`, the site is automatically deployed to Cloudflare Pages.

### Wrangler manifest

The repository includes a `wrangler.toml` manifest so the static build output (`dist/`) can be deployed with Cloudflare Workers when needed. Wrangler reads the account identifier from the `CLOUDFLARE_ACCOUNT_ID` environment variable, so export it locally (for example `export CLOUDFLARE_ACCOUNT_ID=...`) or configure it in CI before running `pnpm wrangler ...` commands.

### Required GitHub Secrets

To enable automated deployments, configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` – Cloudflare API token with Pages:Edit permissions
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: Account → Cloudflare Pages → Edit
- `CLOUDFLARE_ACCOUNT_ID` – Your Cloudflare account ID
  - Find in: Cloudflare Dashboard → Any site → Overview (in the right sidebar)

### GitHub Environment Setup

The deployment workflow uses a `Production` environment for additional protection:

1. Go to Settings → Environments → New environment
2. Create an environment named `Production`
3. (Optional) Add protection rules like required reviewers

## Infrastructure

Infrastructure is managed via OpenTofu in the `infra/` directory.

### Setup

1. Copy the example variables file:
   ```bash
   cd infra
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your actual values:
   - `cloudflare_account_id` - Your Cloudflare account ID
   - `cloudflare_api_token` - API token with appropriate permissions
   - `custom_domains` - List of custom domains (if any)

3. Initialize and apply:
   ```bash
   mise run tf-init
   mise run tf-plan
   mise run tf-apply
   ```

### State Management

OpenTofu state is automatically managed by Spacelift. No backend configuration is needed in `providers.tf` as Spacelift handles state storage in its managed backend.

## Contributing

Consult [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## License

TBD
