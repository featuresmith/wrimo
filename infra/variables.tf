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
  description = "Custom domains to attach to the Cloudflare Worker script. Accepts null/[] to disable, a hostname-keyed map, or a list of hostnames/objects that include a hostname."
  type        = any
  default     = null

  validation {
    condition = (
      var.custom_domains == null
      ? true
      : (
        (
          can(tomap(var.custom_domains))
          ? alltrue([
            for hostname, config in tomap(var.custom_domains) :
            trimspace(hostname) != "" && (
              try(trimspace(config.zone_id), "") != "" ||
              try(trimspace(config.zone), "") != "" ||
              trimspace(hostname) != ""
            )
          ])
          : false
        ) ||
        (
          can(tolist(var.custom_domains))
          ? alltrue([
            for entry in tolist(var.custom_domains) :
            (
              can(entry.hostname)
              ? trimspace(try(entry.hostname, "")) != ""
              : trimspace(try(tostring(entry), "")) != ""
            )
          ])
          : false
        )
      )
    )
    error_message = "Custom domains must be null, empty, a hostname-keyed map, or a list of hostnames/objects that include a hostname."
  }
}

variable "custom_domain_default_zone" {
  description = "Default zone name to apply when a custom domain does not specify zone information."
  type        = string
  default     = null
}

locals {
  custom_domain_entries = (
    var.custom_domains == null
    ? []
    : can(tomap(var.custom_domains))
    ? [
      for hostname, config in tomap(var.custom_domains) :
      {
        hostname = trimspace(hostname)
        config   = config
      }
      if trimspace(hostname) != ""
    ]
    : can(tolist(var.custom_domains))
    ? [
      for entry in tolist(var.custom_domains) :
      (
        can(entry.hostname)
        ? {
          hostname = trimspace(try(entry.hostname, ""))
          config   = entry
        }
        : {
          hostname = trimspace(try(tostring(entry), ""))
          config   = {}
        }
      )
      if(
        can(entry.hostname)
        ? trimspace(try(entry.hostname, "")) != ""
        : trimspace(try(tostring(entry), "")) != ""
      )
    ]
    : []
  )

  custom_domains = {
    for entry in local.custom_domain_entries :
    entry.hostname => {
      zone_id = (
        trimspace(try(lookup(entry.config, "zone_id", ""), "")) != ""
        ? trimspace(try(lookup(entry.config, "zone_id", ""), ""))
        : null
      )

      zone = (
        trimspace(try(lookup(entry.config, "zone", ""), "")) != ""
        ? trimspace(try(lookup(entry.config, "zone", ""), ""))
        : (
          trimspace(try(lookup(entry.config, "zone_id", ""), "")) != ""
          ? null
          : (
            trimspace(try(var.custom_domain_default_zone, "")) != ""
            ? trimspace(try(var.custom_domain_default_zone, ""))
            : entry.hostname
          )
        )
      )

      environment = (
        trimspace(try(lookup(entry.config, "environment", ""), "")) != ""
        ? trimspace(try(lookup(entry.config, "environment", ""), ""))
        : null
      )
    }
  }
}
