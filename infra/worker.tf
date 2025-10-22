resource "cloudflare_workers_script" "worker" {
  account_id         = var.cloudflare_account_id
  name               = var.worker_name
  content            = var.worker_script
  compatibility_date = var.worker_compatibility_date

  lifecycle {
    ignore_changes = [content]
  }
}

resource "cloudflare_workers_domain" "custom" {
  for_each    = local.custom_domains
  account_id  = var.cloudflare_account_id
  hostname    = each.key
  service     = cloudflare_workers_script.worker.name
  environment = lookup(each.value, "environment", "production")
  zone_id     = lookup(each.value, "zone_id", null)

  lifecycle {
    precondition {
      condition     = trimspace(try(each.value.zone_id, "")) != ""
      error_message = "Set cloudflare_zone_id when providing custom_domains."
    }
  }
}

locals {
  worker_secret_keys = toset(
    keys(
      coalesce(
        nonsensitive(var.worker_secrets),
        tomap({})
      )
    )
  )
}

resource "cloudflare_workers_secret" "worker" {
  for_each = { for name in local.worker_secret_keys : name => name }

  account_id  = var.cloudflare_account_id
  name        = each.key
  script_name = cloudflare_workers_script.worker.name
  secret_text = var.worker_secrets[each.key]
}
