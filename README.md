# msazunayed.github.io

Portfolio site (static, GitHub Pages).

## Files
- `index.html`: the whole site (readable, not packed).
- `assets/`: images, certificate thumbnails, PDFs.
  - `assets/img/profile.webp` is the optimized photo (`profile.png` is the fallback).
- `latest.json`: prebuilt GitHub repos + YouTube videos. Generated daily by
  `.github/workflows/update-latest.yml`. When it exists the page does not call
  the GitHub / YouTube APIs or the proxy services on each visit.
- `.nojekyll`: skips Jekyll processing so deploys are faster.

## Setup
1. Repo Settings > Pages > Source: GitHub Actions.
2. Repo Settings > Secrets > Actions: add `YT_API_KEY` (YouTube Data API key).
3. Run the "Update latest.json" workflow once from the Actions tab.
4. Push to `main`; the "Deploy static content to Pages" workflow publishes the site.

## Local preview
    python -m http.server 8000
    # open http://localhost:8000

Note: open the site through a server (not by double-clicking the file) so
`latest.json` and `assets/` load.
