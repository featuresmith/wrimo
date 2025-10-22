locals {
  worker_secret_keys = toset(
    keys(
      coalesce(
        nonsensitive(var.worker_secrets),
        tomap({})
      )
    )
  )

  worker_main_module_path = abspath("${path.module}/${var.worker_main_module_path}")
  worker_assets_directory = abspath("${path.module}/${var.worker_assets_directory}")
}

resource "cloudflare_worker" "worker" {
  account_id = var.cloudflare_account_id
  name       = var.worker_name
}

resource "cloudflare_worker_version" "current" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.worker.id
  main_module        = var.worker_main_module_name
  compatibility_date = var.worker_compatibility_date

  assets = {
    directory = local.worker_assets_directory
  }

  modules = [{
    name         = var.worker_main_module_name
    content_file = local.worker_main_module_path
    content_type = "application/javascript+module"
  }]
}

resource "cloudflare_workers_deployment" "production" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.worker.name
  strategy    = "percentage"

  versions = [{
    version_id = cloudflare_worker_version.current.id
    percentage = 100
  }]
}

resource "cloudflare_workers_domain" "custom" {
  for_each    = local.custom_domains
  account_id  = var.cloudflare_account_id
  hostname    = each.key
  service     = cloudflare_worker.worker.name
  environment = lookup(each.value, "environment", "production")
  zone_id     = lookup(each.value, "zone_id", null)

  lifecycle {
    precondition {
      condition     = trimspace(try(each.value.zone_id, "")) != ""
      error_message = "Set cloudflare_zone_id when providing custom_domains."
    }
  }
}

resource "cloudflare_workers_secret" "worker" {
  for_each = { for name in local.worker_secret_keys : name => name }

  account_id  = var.cloudflare_account_id
  name        = each.key
  script_name = cloudflare_worker.worker.name
  secret_text = var.worker_secrets[each.key]
}
