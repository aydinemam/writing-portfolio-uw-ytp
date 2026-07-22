# Writing Portfolio — UW YTP

A writing portfolio for the University of Washington YTP — Writing for Mechanics course.

## How it works

There's no build step. `index.html` loads a small script (`assets/js/app.js`) that reads the `writing/` folder of this repository directly through the GitHub API, parses each markdown file, and renders it as a portfolio entry. Publishing new writing is just:

1. Add a new `.md` file to `writing/`.
2. Give it a frontmatter block (see format below).
3. Commit and push to `main`.
4. Refresh the site — the new piece appears automatically. No rebuild, no manifest file to update.

## Publishing a new piece

Create a file in `writing/`, e.g. `writing/2026-02-03-my-new-essay.md`:

```markdown
---
title: My New Essay
date: 2026-02-03
tag: Essay
excerpt: One or two sentences describing the piece — shown on the home page.
---

The body of your essay goes here, written in normal markdown.

## Headings, **bold**, *italics*, and > blockquotes all work.
```

Frontmatter fields:

- `title` — required. Shown as the piece's heading.
- `date` — used for sorting (newest first) and displayed under the title.
- `tag` — a short category label (e.g. `Essay`, `Reflection`, `Personal Narrative`).
- `excerpt` — a short summary shown on the home page listing.

The filename itself just needs to end in `.md` — it becomes the piece's URL slug.

## Local preview

No dependencies or build tooling are required. From the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` directly via `file://` won't work — the browser blocks the GitHub API fetch from a file origin.)

## Project structure

```
index.html                    site shell
assets/css/style.css          styling
assets/js/app.js              fetches + renders writing/ from GitHub, handles routing
assets/vendor/marked.min.js   markdown parser (vendored, no CDN dependency at runtime)
writing/                      your published pieces (.md files)
```
