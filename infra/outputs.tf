output "pages_project_id" {
  description = "Identifier of the Cloudflare Pages project."
  value       = cloudflare_pages_project.wrimo.id
}

output "pages_project_name" {
  description = "Name of the Cloudflare Pages project."
  value       = cloudflare_pages_project.wrimo.name
}

output "pages_project_subdomain" {
  description = "Default Cloudflare Pages subdomain for the project."
  value       = cloudflare_pages_project.wrimo.subdomain
}

output "custom_domains" {
  description = "Custom domains attached to the Cloudflare Pages project."
  value       = [for domain in cloudflare_pages_domain.custom : domain.domain]
}
