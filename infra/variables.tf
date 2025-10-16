variable "cloudflare_account_id" {
  description = "Cloudflare account identifier that owns the Pages project."
  type        = string
}

variable "cloudflare_api_token" {
  description = "API token with Pages:Edit (and related) permissions."
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Cloudflare Pages project name."
  type        = string
  default     = "wrimo"
}

variable "production_branch" {
  description = "Git branch to deploy to production."
  type        = string
  default     = "main"
}

variable "compatibility_date" {
  description = "Cloudflare Pages compatibility date for the production environment."
  type        = string
  default     = "2024-05-01"
}

variable "production_env_vars" {
  description = "Additional environment variables for the production deployment."
  type        = map(string)
  default     = {}
}

variable "custom_domains" {
  description = "Custom domains to attach to the Cloudflare Pages project."
  type        = list(string)
  default     = []
}
