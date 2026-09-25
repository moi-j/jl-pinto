# Deploy: GitHub (moi-j) + Cloudflare Pages

## Repository

- **GitHub user:** [moi-j](https://github.com/moi-j)
- **Suggested repo name:** `jl-pinto`
- **Production URL:** `https://jlpinto.com` (custom domain in Cloudflare)

## One-time: GitHub CLI as moi-j

The machine must be logged into GitHub as **moi-j** (not another account):

```bash
gh auth login -h github.com
# Choose GitHub.com → HTTPS or SSH → authenticate as moi-j
gh auth status   # should show account moi-j
```

Then from this project folder:

```bash
gh repo create jl-pinto --public --source=. --remote=origin --push
```

If the repo already exists on GitHub, only add the remote and push:

```bash
git remote add origin git@github.com:moi-j/jl-pinto.git
git push -u origin main
```

## One-time: Cloudflare Pages

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize **GitHub** and select **`moi-j/jl-pinto`**.
3. Build settings:

   | Setting | Value |
   |---------|--------|
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (repo root) |

4. **Environment variables** (optional but recommended):

   | Name | Value |
   |------|--------|
   | `NODE_VERSION` | `22.12.0` |

5. **Save and deploy**. Every push to `main` triggers a new build.

## Custom domain (jlpinto.com)

1. In the Pages project → **Custom domains** → add `jlpinto.com` and `www.jlpinto.com` if needed.
2. Cloudflare will show DNS records; point the domain’s nameservers to Cloudflare if it is not already there.
3. Redirect rules in `public/_redirects` are copied into `dist/` on build (legacy WordPress URLs).

## Local check before push

```bash
npm install
npm run build
npm run preview
```

## After content changes

```bash
git add -A
git commit -m "Describe the change"
git push
```

Cloudflare rebuilds automatically; no manual upload of `dist/` is required.
