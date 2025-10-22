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
}

variable "custom_domains" {
  description = "Custom domains to attach to the Cloudflare Worker script. Keys are hostnames; values may provide either a zone identifier or name plus an optional environment."
  type = map(object({
    zone        = optional(string)
    zone_id     = optional(string)
    environment = optional(string)
  }))
  default = {}

  validation {
    condition = alltrue([
      for domain, config in var.custom_domains :
      try(config.zone_id != null && config.zone_id != "", false) || try(config.zone != null && config.zone != "", false)
    ])
    error_message = "Each custom domain must supply either zone_id or zone."
  }
}
