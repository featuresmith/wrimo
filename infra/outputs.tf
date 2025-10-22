output "worker_script_id" {
  description = "Identifier of the Cloudflare Worker."
  value       = cloudflare_worker.worker.id
}

output "worker_script_name" {
  description = "Name of the Cloudflare Worker."
  value       = cloudflare_worker.worker.name
}

output "worker_version_id" {
  description = "Identifier of the active Worker version uploaded by Terraform."
  value       = cloudflare_worker_version.current.id
}

output "worker_domains" {
  description = "Custom domains attached to the Cloudflare Worker script, keyed by hostname."
  value = {
    for hostname, domain in cloudflare_workers_domain.custom :
    hostname => {
      zone_id     = domain.zone_id
      environment = domain.environment
    }
  }
}

output "worker_secret_names" {
  description = "Secrets managed for the Cloudflare Worker script."
  value       = [for name in keys(cloudflare_workers_secret.worker) : name]
  sensitive   = true
}
