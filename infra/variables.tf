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
  description = "Custom domains to attach to the Cloudflare Worker script. Provide a map keyed by hostname with a zone identifier or zone name and optional environment. Set to null, {}, or [] to disable custom domains."
  type        = any
  default     = null

  validation {
    condition = (
      var.custom_domains == null ||
      (
        can(tomap(var.custom_domains)) &&
        alltrue([
          for _, config in tomap(var.custom_domains) :
          (
            try(trimspace(config.zone_id), "") != "" ||
            try(trimspace(config.zone), "") != ""
          )
        ])
      ) ||
      (
        can(tolist(var.custom_domains)) &&
        try(length(tolist(var.custom_domains)), 0) == 0
      )
    )
    error_message = "Custom domains must be provided as a hostname-keyed map with a zone_id or zone, or left empty."
  }
}

locals {
  custom_domains = (
    var.custom_domains == null
    ? {}
    : can(tomap(var.custom_domains))
    ? tomap(var.custom_domains)
    : {}
  )
}
