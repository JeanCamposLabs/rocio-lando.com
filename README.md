# Rocío Landó — Portfolio

The portfolio of **Rocío Landó**, illustrator & graphic artist — _drawing the unseen_.

An elegant, animation-rich, fully responsive “ink & paper” portfolio with a
living, self-serve gallery, individual artwork pages, a pinned project
storyteller, a hidden arcade game, and a few quiet surprises.

> 🎨 **Adding new art?** You don't need this file — see
> **[HOW-TO-ADD-WORK.md](./HOW-TO-ADD-WORK.md)**.

---

## ✨ Highlights

- **Editorial “ink & paper” design system** — warm paper, deep ink, terracotta &
  Caribbean-teal accents, with a one-tap **day / night** theme.
- **Typography:** Fraunces (display, with its artisanal optical axes), Manrope
  (text), and Caveat for handwritten margin notes.
- **Heavy, tasteful motion:** smooth scrolling (Lenis), GSAP scroll animations,
  kinetic type, a pinned horizontal **Projects** storyteller, a custom ink
  cursor, magnetic buttons, blur-up images, and an animated preloader.
- **Living gallery:** filterable masonry that never crops the art, a full
  lightbox, individual `/work/<slug>` pages, and built-in “coming soon” slots.
- **A real game:** _Ink Catch_, a hand-built canvas arcade game (also at `/play`).
- **Surprises:** the **Konami code** rains sketches, and pressing **`D`** opens a
  secret doodle mode you can draw on the page with.
- **Self-serve content** via Astro content collections **+ a visual CMS** at
  `/admin`. Drop in unlimited works without touching code.
- **Automatic image pipeline:** every image is turned into responsive WebP at
  multiple sizes with blur-up placeholders — fast even with hundreds of works.
- **Accessible & resilient:** semantic HTML, keyboard support, `prefers-reduced-motion`
  honoured, and content still shows with JavaScript disabled.
- **SEO:** per-page meta + Open Graph, `VisualArtwork` / `Person` structured
  data, sitemap and robots.

## 🧱 Tech

[Astro 5](https://astro.build) · TypeScript · GSAP + ScrollTrigger · Lenis ·
sharp · Decap CMS · deployed to GitHub Pages.

## 🚀 Local development

```bash
npm install
npm run dev        # optimises images, then starts the dev server
```

| Command | What it does |
|---|---|
| `npm run dev` | Optimise images + start dev server |
| `npm run build` | Optimise images + build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run optimize` | (Re)generate optimised images + manifest |

> Node 18.20.8+, 20, or 22.

## 📁 Project structure

```
public/
  works/            ← gallery images (artist drops files here)
  projects/         ← project / case-study images
  site/             ← portrait, og image, icons
  admin/            ← Decap CMS (Studio Manager)
  CNAME, robots.txt, favicon.svg
src/
  content/
    works/          ← one .md per artwork  (the gallery)
    projects/       ← one .md per project
  data/
    site.json       ← all site copy (editable in the CMS)
    site.ts         ← typed accessor
  components/       ← Hero, Gallery, Projects, Game, …
  layouts/Base.astro
  pages/
    index.astro
    work/[slug].astro
    play.astro
    404.astro
  scripts/
    main.ts         ← scroll, cursor, menu, lightbox, easter eggs
    game.ts         ← Ink Catch
  styles/           ← tokens.css + global.css
scripts/
  optimize-images.mjs  ← the image pipeline (runs on every build)
```

## 🌍 Deployment

Pushing to `main` triggers **`.github/workflows/deploy.yml`**, which builds the
site and deploys it to **GitHub Pages**.

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment → Source** and choose **GitHub Actions**. The custom domain
`rocio-lando.com` is served via `public/CNAME` — point the domain's DNS at
GitHub Pages when you're ready to switch.

> Prefer the old FTP host? Keep the build step and swap the deploy step for an
> FTP action that uploads `./dist` (instead of the repo root).

## 🛟 The original site is safe

The first hand-coded version of the site is preserved, untouched, on the
**`backup/original-site`** branch on GitHub. Nothing was lost in the redesign.

## 🔤 Editing site text

Headline, bio, FAQ, services, social links and contact details all live in
[`src/data/site.json`](./src/data/site.json) — editable directly or through
**Studio Manager → Site Text & Contact**.

---

© Rocío Landó. All artwork is the artist's own.
