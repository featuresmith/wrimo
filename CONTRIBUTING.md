# Contributing to Wrimo

Thank you for your interest in contributing to Wrimo! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and OS information

### Suggesting Enhancements

We love new ideas! Open an issue with:
- A clear, descriptive title
- Detailed description of the proposed feature
- Why this feature would be useful
- Examples of how it would work

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Set up your development environment** (see below)
3. **Make your changes** with clear, descriptive commits
4. **Test your changes** by previewing the site locally
5. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Keep pull requests focused on a single feature or fix
- Write clear commit messages
- Update documentation if needed
- Ensure the site looks good on different screen sizes
- Follow the existing code style

#### Pull Request Process

1. Once you open a non-draft PR, auto-merge will be enabled automatically
2. A maintainer will review your changes
3. Make any requested changes
4. Once approved, your PR will be automatically merged with a squash commit

## Development Setup

### Prerequisites

We use [mise](https://mise.jdx.dev/) to manage development dependencies. Install it first:

```bash
# macOS/Linux
curl https://mise.run | sh

# Or with Homebrew
brew install mise
```

### Getting Started

1. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/wrimo.git
   cd wrimo
   ```

2. **Install dependencies:**
   ```bash
   # Install Node.js, pnpm, and OpenTofu via mise
   mise install

   # Install project dependencies
   pnpm install
   ```

3. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Start the development server:**
   ```bash
   mise run dev
   ```

   Open http://localhost:5173 in your browser

5. **Make your changes** to `index.html`

6. **Test your changes:**
   - Check the site on different screen sizes
   - Test in multiple browsers if possible
   - Ensure the site is still responsive

7. **Build for production** (optional):
   ```bash
   mise run build
   ```

8. **Preview the Worker locally** (optional):
   ```bash
   pnpm build
   npx wrangler dev --assets dist
   ```

   This runs the Worker at http://localhost:8787 using the production bundle.

9. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```

10. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

11. **Open a Pull Request** on GitHub

## Development Tools

This project uses modern development tools:

- **mise** – Dev environment management
- **Node.js 25** – JavaScript runtime
- **pnpm 9** – Fast, efficient package manager
- **Vite 6** – Lightning-fast development server with HMR
- **OpenTofu 1.8** – Infrastructure as code (for maintainers)

## Available Commands

```bash
# Development
mise run dev          # Start dev server (http://localhost:5173)
mise run build        # Build for production
mise run preview      # Preview production build
pnpm build && \
  npx wrangler dev --assets dist  # Run Worker preview (http://localhost:8787)

# Infrastructure (maintainers only)
mise run tf-init      # Initialize OpenTofu
mise run tf-plan      # Plan infrastructure changes
mise run tf-apply     # Apply infrastructure changes
```

## Code Style

### HTML
- Use proper indentation (4 spaces)
- Use semantic HTML elements
- Include appropriate ARIA attributes for accessibility
- Keep the structure clean and readable

### CSS
- Use meaningful class names
- Group related styles together
- Add comments for complex sections
- Maintain mobile responsiveness (use media queries)
- Test on different screen sizes

### Commit Messages

Use clear, descriptive commit messages with prefixes:
- `Add: new feature or content`
- `Fix: bug fix`
- `Update: changes to existing functionality`
- `Refactor: code restructuring without functionality changes`
- `Docs: documentation changes`
- `Style: CSS or formatting changes`

Example: `Add: responsive navigation menu with mobile support`

## Project Structure

```
wrimo/
├── index.html             # Main site (single page)
├── package.json           # Node.js dependencies
├── wrangler.toml          # Local Worker manifest
├── worker/                # Cloudflare Worker module
│   └── index.js
├── .mise.toml             # Development tool versions
├── .github/workflows/     # CI/CD automation
│   └── auto-merge.yml     # Auto-merge PRs
└── infra/                 # Infrastructure as code
    ├── providers.tf       # OpenTofu providers
    ├── variables.tf       # Variable definitions
    ├── worker.tf          # Cloudflare Worker config (module + assets)
    ├── outputs.tf         # Output definitions
    └── terraform.tfvars.example  # Sample variable overrides
```

## Deployment

The site is deployed by Spacelift applying the OpenTofu stack. Terraform uploads the Worker module and static assets via `cloudflare_worker_version`, so merging to `main` automatically promotes the new build once Spacelift finishes running `pnpm build` and `tofu apply`.

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We're all here to make Wrimo better together!

Thank you for contributing! 🎉
