variable "cloudflare_account_id" {
  description = "Cloudflare account identifier that owns the Worker script."
  type        = string
}

variable "cloudflare_api_token" {
  description = "API token with Workers:Edit (and related) permissions."
  type        = string
  sensitive   = true
}

variable "worker_name" {
  description = "Cloudflare Worker name."
  type        = string
  default     = "wrimo"
}

variable "worker_script" {
  description = "Initial Worker script content. The deployment pipeline should update this after the script is created."
  type        = string
  default     = <<-EOT
  addEventListener("fetch", event => {
    event.respondWith(new Response("Wrimo Worker placeholder", { status: 200 }));
  });
  EOT
}

variable "worker_compatibility_date" {
  description = "Cloudflare Workers compatibility date for the Worker."
  type        = string
  default     = "2024-05-01"
}

variable "worker_secrets" {
  description = "Secrets to attach to the production Worker environment."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "custom_domains" {
  description = "List of custom domain hostnames to attach to the Cloudflare Worker script. Set to [] or null to disable."
  type        = list(string)
  default     = []
  nullable    = true

  validation {
    condition     = var.custom_domains == null || alltrue([for hostname in var.custom_domains : trimspace(hostname) != ""])
    error_message = "Custom domain hostnames must be non-empty strings."
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone identifier applied to each custom domain hostname."
  type        = string
  default     = null

  validation {
    condition     = var.cloudflare_zone_id == null || trimspace(var.cloudflare_zone_id) != ""
    error_message = "cloudflare_zone_id must be a non-empty string when set."
  }
}

locals {
  custom_domain_hostnames = (
    var.custom_domains == null
    ? []
    : [
      for hostname in var.custom_domains :
      trimspace(hostname)
      if trimspace(hostname) != ""
    ]
  )

  default_custom_domain_zone_id = (
    trimspace(try(var.cloudflare_zone_id, "")) != ""
    ? trimspace(var.cloudflare_zone_id)
    : null
  )

  custom_domains = {
    for hostname in toset(local.custom_domain_hostnames) :
    hostname => {
      zone_id     = local.default_custom_domain_zone_id
      environment = "production"
    }
  }
}
