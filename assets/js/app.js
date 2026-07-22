// Reads markdown pieces straight from the /writing folder of this GitHub repo
// and renders them. To publish something new: add a .md file to /writing
// (with a frontmatter block, see README) and push — no build step needed.

const REPO_OWNER = "aydinemam";
const REPO_NAME = "writing-portfolio-uw-ytp";
const REPO_BRANCH = "main";
const WRITING_PATH = "writing";

const app = document.getElementById("app");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Very small YAML-ish frontmatter parser: handles `key: value` pairs
// between leading `---` lines. Good enough for title/date/tag/excerpt.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const [, block, body] = match;
  const meta = {};
  block.split("\n").forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) return;
    let value = m[2].trim();
    value = value.replace(/^["'](.*)["']$/, "$1");
    meta[m[1].trim()] = value;
  });
  return { meta, body: body.trim() };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function slugFromFilename(name) {
  return name.replace(/\.md$/i, "");
}

let piecesCache = null;

async function fetchPieces() {
  if (piecesCache) return piecesCache;

  const listUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${WRITING_PATH}?ref=${REPO_BRANCH}`;
  const listRes = await fetch(listUrl, { headers: { Accept: "application/vnd.github+json" } });

  if (listRes.status === 404) {
    piecesCache = [];
    return piecesCache;
  }
  if (!listRes.ok) {
    throw new Error(`GitHub API error (${listRes.status}) while listing pieces.`);
  }

  const files = (await listRes.json()).filter(
    (f) => f.type === "file" && f.name.toLowerCase().endsWith(".md")
  );

  const pieces = await Promise.all(
    files.map(async (f) => {
      const res = await fetch(f.download_url);
      const raw = await res.text();
      const { meta, body } = parseFrontmatter(raw);
      const slug = slugFromFilename(f.name);
      return {
        slug,
        filename: f.name,
        title: meta.title || slug.replace(/[-_]/g, " "),
        date: meta.date || "",
        tag: meta.tag || meta.category || "",
        excerpt: meta.excerpt || "",
        body,
      };
    })
  );

  pieces.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  piecesCache = pieces;
  return pieces;
}

function renderHome(pieces) {
  const header = `
    <section class="hero">
      <h1>Selected Writing</h1>
      <p>Writting Portfolio for University of Washington YTP - Mechanics of Writing for High School course. </p>
    </section>
  `;

  if (!pieces.length) {
    app.innerHTML = header + `
      <p class="empty">No pieces published yet. Add a markdown file to the <code>writing/</code> folder on GitHub and it will appear here automatically.</p>
    `;
    return;
  }

  const items = pieces
    .map((p) => {
      const metaBits = [];
      if (p.tag) metaBits.push(`<span class="piece-tag">${escapeHtml(p.tag)}</span>`);
      if (p.date) metaBits.push(`<span>${escapeHtml(formatDate(p.date))}</span>`);
      return `
        <li>
          <article class="piece-card">
            <div class="piece-meta">${metaBits.join("")}</div>
            <h2><a href="#/piece/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h2>
            ${p.excerpt ? `<p class="piece-excerpt">${escapeHtml(p.excerpt)}</p>` : ""}
            <a class="read-more" href="#/piece/${encodeURIComponent(p.slug)}">Read &rarr;</a>
          </article>
        </li>
      `;
    })
    .join("");

  app.innerHTML = header + `<ul class="piece-list">${items}</ul>`;
}

function renderPiece(pieces, slug) {
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) {
    app.innerHTML = `<p class="error">Couldn't find that piece.</p><a class="back-link" href="#/">&larr; Back to all writing</a>`;
    return;
  }

  const metaBits = [];
  if (piece.tag) metaBits.push(`<span class="piece-tag">${escapeHtml(piece.tag)}</span>`);
  if (piece.date) metaBits.push(`<span>${escapeHtml(formatDate(piece.date))}</span>`);

  const html = window.marked ? marked.parse(piece.body) : `<pre>${escapeHtml(piece.body)}</pre>`;

  app.innerHTML = `
    <a class="back-link" href="#/">&larr; Back to all writing</a>
    <header class="piece-header">
      <div class="piece-meta">${metaBits.join("")}</div>
      <h1>${escapeHtml(piece.title)}</h1>
    </header>
    <div class="piece-body">${html}</div>
  `;
  window.scrollTo(0, 0);
}

async function router() {
  const hash = window.location.hash || "#/";

  app.innerHTML = `<p class="loading">Loading…</p>`;

  try {
    const pieces = await fetchPieces();
    const pieceMatch = hash.match(/^#\/piece\/(.+)$/);
    if (pieceMatch) {
      renderPiece(pieces, decodeURIComponent(pieceMatch[1]));
    } else {
      renderHome(pieces);
    }
  } catch (err) {
    app.innerHTML = `<p class="error">Something went wrong loading the portfolio: ${escapeHtml(err.message)}</p>`;
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
