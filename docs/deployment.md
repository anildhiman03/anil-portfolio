# Deployment (GitHub Actions → SSH/rsync)

Every push to `main` triggers `.github/workflows/deploy.yml`. The GitHub Actions
runner **rsyncs** the repo straight to the Hostinger server over SSH — no build
step, since this is a static HTML/CSS/JS site with no dependencies and no
database. You can also run it manually from the GitHub **Actions** tab ("Run
workflow").

This site shares the same Hostinger account as the `crm` and `gas-reading`
projects (see `~/Sites/crm/docs/deployment.md`), so it reuses the same SSH
deploy key.

## Server layout (Hostinger shared hosting)

Live URL: **https://anildhiman.com**

```
~/domains/anildhiman.com/public_html/   # docroot — this repo's files live here directly
  crm -> ~/crm/public                   # crm.anildhiman.com (unrelated app, preserved)
  gas -> ~/gas-reading/public           # gas.anildhiman.com (unrelated app, preserved)
  index.html, styles.css, script.js...  # this site
  .htaccess                             # forces index.html as the directory index
```

Unlike `crm`/`gas-reading`, this site's docroot **is** `public_html` itself —
there's no separate `~/anil-portfolio` source checkout on the server, since
there's nothing to keep out of the web root (no `.env`, no PHP source, no
build artifacts). The `crm` and `gas` symlinks for the other apps hosted on
this same root domain live alongside it and must never be deleted.

## GitHub repository secrets

Set under **Settings → Secrets and variables → Actions** (this repo):

| Secret            | Value                                              |
| ----------------- | --------------------------------------------------- |
| `SSH_HOST`        | `89.117.188.44`                                     |
| `SSH_USER`        | `u908906130`                                        |
| `SSH_PORT`        | `65002`                                             |
| `SSH_PRIVATE_KEY` | contents of `~/.ssh/crm_deploy_key` (shared key)    |
| `DEPLOY_PATH`     | `/home/u908906130/domains/anildhiman.com/public_html` |

The matching public key is already in the server user's
`~/.ssh/authorized_keys` from the `crm` setup — no new key needed, it's the
same account.

## What rsync does / doesn't touch

`rsync --delete` mirrors this repo into `DEPLOY_PATH`, but these are
**excluded** (so they are preserved on the server and never deleted):

- `crm`, `gas` — symlinks to the other apps hosted on this root domain
- `.git`, `.github`, `docs`, `README.md` — not part of the published site

Everything else in the repo (`index.html`, `styles.css`, `script.js`,
`assets/`, `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml`,
`llms.txt`) is mirrored as-is.

## Deploy

```bash
git push origin main
```

Watch progress in the GitHub **Actions** tab. Deploys are serialized
(concurrency group) so overlapping pushes won't run on top of each other.

## Manual deploy from a laptop (fallback)

```bash
rsync -az --delete \
  --exclude='.git' --exclude='.github' --exclude='docs' --exclude='README.md' \
  --exclude='crm' --exclude='gas' \
  -e "ssh -i ~/.ssh/crm_deploy_key -p 65002" \
  ./ u908906130@89.117.188.44:/home/u908906130/domains/anildhiman.com/public_html/
```
