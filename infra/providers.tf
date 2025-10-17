terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.8.0"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Spacelift automatically manages OpenTofu state – no backend block needed
# State is stored in Spacelift's managed backend
