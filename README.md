# Alec Is Sober

A tiny static site that tracks time sober and estimated savings. Forked and adapted from [ja-k-e/jake-quits](https://github.com/ja-k-e/jake-quits).

Live site:

- https://sober.alecvdp.com/

## Features

- Live counters: seconds, minutes, hours, days, weeks, months, years
- Estimated savings based on your daily spend
- Simple controls to set:
	- Start date/time
	- Daily cost
	- Currency
	- Name
	- Accent color
- Shareable URL that preserves your settings
- Settings persist in your browser

## URL parameters

You can customize the page via query params. These sync with the UI controls.

- `n` — name (string)
- `d` — start datetime in `YYYY-MM-DDTHH:MM` (local) or milliseconds since epoch
- `s` — daily cost (number)
- `c` — currency (up to 3 characters)
- `h` — color hex without `#` (supports 3- or 6-digit; e.g. `FFBB00`)

Example:

- `?n=Alec&d=2025-05-17T06:00&h=FFBB00&s=20&c=$`

Defaults in this fork:

- Name: `Alec`
- Start: `2025-05-17T06:00`
- Daily: `20`
- Currency: `$`
- Color: `FFBB00`

## Develop locally

This is a static site—no build step required.

Open `index.html` directly, or serve the folder locally to avoid browser restrictions:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

GitHub Pages is set up to auto-deploy on push to `main` using GitHub Actions:

- Workflow: `.github/workflows/deploy.yml`
- Artifact path: repo root (`.`)
- Jekyll disabled via `.nojekyll`

If you fork this repo, ensure Pages is enabled for your fork (Settings → Pages) or keep the workflow’s `enablement: true`.

## Attribution

Originally based on [ja-k-e/jake-quits](https://github.com/ja-k-e/jake-quits). Thanks!


