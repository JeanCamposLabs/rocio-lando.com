# 🎨 How to add new artwork — a guide for Rocío

Your portfolio is **data-driven**: every drawing in the gallery is just an image
file plus a little text file. Add as many as you like — the layout, the
optimisation, the thumbnails and the individual artwork page all happen
automatically. You never touch code.

There are **two ways** to add a piece. Pick whichever feels comfy.

---

## ✨ Option A — Studio Manager (the easy, visual way)

A friendly form with drag-and-drop image upload, living at:

> **https://rocio-lando.com/admin**

1. Open `/admin` and log in (see *Turning the login on* below the first time).
2. Click **Artworks → New Artwork**.
3. **Drag your image** into the *Image* box.
4. Fill in the title, pick a category, add a short caption — anything you don't
   know you can leave blank.
5. Hit **Publish**.

That's it. In a minute or two the site rebuilds itself and your new piece is
live, with its own shareable page and a spot in the gallery. 🎉

> **Tip:** Toggle **“Feature this piece”** to push a favourite to the very front
> of the gallery, and use **Order** (lower number = earlier) to fine-tune.

### Turning the login on (one time only)

The Studio Manager needs to know it's allowed to save into GitHub. The simplest,
free options:

- **Easiest:** host the site on **Netlify** (free) and turn on *Identity* +
  *Git Gateway*. Then `/admin` just asks for your email and you're in. Change
  one line in `public/admin/config.yml` — `backend: github` → `backend: git-gateway`.
- **On your own computer:** run `npx decap-server` in the project folder, then
  open `http://localhost:4321/admin`. No login at all — perfect for adding a
  batch of works in one sitting, then it commits for you.
- **On GitHub Pages:** connect a free OAuth helper (see the Decap docs:
  <https://decapcms.org/docs/external-oauth-clients/>).

If this ever feels fiddly, just use **Option B** — it always works.

---

## 📝 Option B — Straight on GitHub (no setup, works today)

This uses GitHub's own website. Nothing to install.

### Step 1 — Upload the image
1. Go to the repo → the **`public/works`** folder.
2. Click **Add file → Upload files**.
3. Drag your scan/photo in (a JPG or PNG is perfect — any size, it gets
   optimised automatically). Give it a tidy name like `red-rooftops.jpg`.
4. Click **Commit changes**.

### Step 2 — Describe it
1. Go to the **`src/content/works`** folder.
2. Click **Add file → Create new file**.
3. Name it after your image, ending in `.md` — e.g. `red-rooftops.md`.
4. Paste this template and edit the bits in quotes:

```markdown
---
title: "Red Rooftops"
image: "/works/red-rooftops.jpg"
alt: "Ink and watercolour sketch of a row of red-roofed houses."
category: "watercolor"        # architecture · watercolor · animals · botanical · travel
medium: "Ink & watercolour"
year: 2026
location: "Willemstad, Curaçao"
description: "A quick street study on a hot afternoon."
tags: ["watercolor", "architecture"]
featured: false               # true = show at the very front
order: 50                     # lower number shows earlier
---
```

5. Click **Commit changes**. Done — the site rebuilds and your piece appears. ✨

---

## 🪧 The placeholder slots

The gallery shows a couple of dashed **“a new piece, soon”** tiles on purpose —
they're friendly reminders that there's always room for more. To turn one into a
real piece, just add an image to it (set `placeholder: false` and fill in the
`image`). Want more empty slots? Duplicate `src/content/works/coming-soon-1.md`.

---

## 🧾 The fields, explained

| Field | What it does | Needed? |
|-------|--------------|---------|
| `title` | Name shown on the piece | ✅ |
| `image` | Path like `/works/your-file.jpg`. Leave empty for a placeholder slot. | – |
| `alt` | A sentence describing the image (helps Google & screen readers) | recommended |
| `category` | One of: `architecture`, `watercolor`, `animals`, `botanical`, `travel` | ✅ |
| `medium` | e.g. “Pen & ink on paper” | – |
| `year` | e.g. `2026` | – |
| `location` | Where you drew it | – |
| `description` | A short caption (shown in the viewer & on the piece's page) | – |
| `tags` | Little keywords, e.g. `["dogs", "watercolor"]` | – |
| `featured` | `true` shows it first | – |
| `order` | Lower number = earlier in the gallery | – |
| `draft` | `true` hides it from the site | – |

---

## 🤝 Adding a “Project” (a series or collaboration)

Same idea, in `src/content/projects/`. A project has a **cover**, a **summary**
and a list of **images**. Copy `no-place-like-home.md` as a starting point, or
use **Studio Manager → Projects & Series → New**.

---

## ❓ Good to know

- **Any image size is fine.** A build step makes fast, sharp WebP versions at
  several sizes automatically — you never resize anything.
- **You can't break the layout.** Add 5 works or 500; the gallery just grows.
- **Mistake?** Every change is saved in history and can be undone. And the
  original first version of the site is kept safe on the `backup/original-site`
  branch.

Happy drawing 💛
