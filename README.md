# rocio-lando.com

Portfolio of **Rocío Landó** — professional illustrator & graphic artist.
Detailed ink and watercolor illustrations of architecture, animals, and nature.

A single-page static site (plain HTML + CSS + vanilla JS) deployed to
**GitHub Pages** with the custom domain `rocio-lando.com`.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | The whole page (hero mosaic, projects, FAQ). |
| `style.css` | All styles. |
| `Hero Images/`, `images/`, `projects2/` | Artwork assets. |
| `favicon.svg` | Site icon. |
| `robots.txt`, `sitemap.xml` | SEO. |
| `version.json` | Build stamp; powers client auto-refresh on new deploys. |
| `.github/workflows/deploy.yml` | Uploads the repo to GitHub Pages on push to `main`. |

## Deploying

Push to `main`. The GitHub Actions workflow publishes the site to GitHub
Pages and stamps `version.json` with the commit SHA. Open tabs poll that
file and reload automatically when a new version goes live.
