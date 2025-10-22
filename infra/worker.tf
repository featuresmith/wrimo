resource "cloudflare_workers_script" "worker" {
  account_id         = var.cloudflare_account_id
  name               = var.worker_name
  content            = var.worker_script
  compatibility_date = var.worker_compatibility_date

  lifecycle {
    ignore_changes = [content]
  }
}

data "cloudflare_zone" "custom" {
  for_each = {
    for hostname, config in var.custom_domains :
    hostname => config
    if try(config.zone_id, null) == null
  }

  name = each.value.zone
}

resource "cloudflare_workers_domain" "custom" {
  for_each    = var.custom_domains
  account_id  = var.cloudflare_account_id
  hostname    = each.key
  service     = cloudflare_workers_script.worker.name
  environment = try(each.value.environment, "production")
  zone_id = coalesce(
    try(each.value.zone_id, null),
    try(data.cloudflare_zone.custom[each.key].id, null)
  )
}

resource "cloudflare_workers_secret" "worker" {
  for_each    = var.worker_secrets
  account_id  = var.cloudflare_account_id
  name        = each.key
  script_name = cloudflare_workers_script.worker.name
  secret_text = each.value
}
