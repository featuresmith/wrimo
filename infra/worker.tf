locals {
  worker_secret_map = (
    var.worker_secrets != null
    ? var.worker_secrets
    : tomap({})
  )

  worker_secret_bindings = [
    for name, value in local.worker_secret_map : {
      name = name
      type = "secret_text"
      text = value
    }
  ]

  worker_secret_names = sort(keys(local.worker_secret_map))

  worker_main_module_path = abspath("${path.module}/${var.worker_main_module_path}")
  worker_assets_directory = abspath("${path.module}/${var.worker_assets_directory}")
}

check "custom_domains_require_zone_id" {
  assert {
    condition = (
      length(local.custom_domain_hostnames) == 0
      ? true
      : (
        var.cloudflare_zone_id != null && trimspace(var.cloudflare_zone_id) != ""
      )
    )

    error_message = "Set cloudflare_zone_id when providing custom_domains."
  }
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

  bindings = (
    length(local.worker_secret_bindings) > 0
    ? local.worker_secret_bindings
    : null
  )

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

resource "cloudflare_workers_custom_domain" "custom" {
  for_each    = local.custom_domains
  account_id  = var.cloudflare_account_id
  hostname    = each.key
  service     = cloudflare_worker.worker.name
  environment = lookup(each.value, "environment", "production")
  zone_id     = each.value.zone_id

  lifecycle {
    precondition {
      condition = (
        each.value.zone_id == null
        ? false
        : trimspace(each.value.zone_id) != ""
      )
      error_message = "Set cloudflare_zone_id when providing custom_domains."
    }
  }
}
