resource "cloudflare_pages_project" "wrimo" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  # No source block - deployments are handled via GitHub Actions using cloudflare/pages-action
  # This creates the Pages project infrastructure only

}

resource "cloudflare_pages_domain" "custom" {
  for_each     = toset(var.custom_domains)
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.wrimo.name
  domain       = each.value
}
