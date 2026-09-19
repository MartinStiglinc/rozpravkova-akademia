#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "stories.json");
const TEMPLATE_PATH = path.join(ROOT, "stories", "story-template.html");
const CONTENT_DIR = path.join(ROOT, "stories", "content");
const OUTPUT_DIR = path.join(ROOT, "stories");

const PLACEHOLDER_CONTENT = `<div class="story-placeholder">

<h2>Obsah rozprávky</h2>

<p>
LOREM IPSUM EST...
</p>

<p>
Sem bude neskôr vložený kompletný príbeh.
</p>

<p>
Obsah bude generovaný a spravovaný samostatne.
</p>

</div>`;

const LEARN_CHECK_ICON = `<span class="learn-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                    <path fill="currentColor" d="M9.3 16.3 5.7 12.7l-1.4 1.4 5 5 10-10-1.4-1.4z"></path>
                  </svg>
                </span>`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugFromUrl(url) {
  return path.basename(String(url || ""), ".html");
}

function fileNameFromUrl(url) {
  return path.basename(String(url || ""));
}

function seoDescription(story, category) {
  if (story.seoDescription) {
    return story.seoDescription;
  }

  return `${story.description} Poučná rozprávka z kategórie ${category.name} pre deti (${story.age}).`;
}

function loadStoryContent(slug) {
  const contentPath = path.join(CONTENT_DIR, `${slug}.html`);

  if (fs.existsSync(contentPath)) {
    return fs.readFileSync(contentPath, "utf8").replace(/\s+$/, "");
  }

  return PLACEHOLDER_CONTENT;
}

function renderLearnBlock(story) {
  if (Array.isArray(story.lesson) && story.lesson.length) {
    const items = story.lesson
      .map(
        (item) => `              <li>
                ${LEARN_CHECK_ICON}
                <span>${escapeHtml(item)}</span>
              </li>`
      )
      .join("\n");

    return `            <ul class="learn-list">
${items}
            </ul>`;
  }

  return `            <p>✅ Poučenie bude doplnené neskôr</p>`;
}

function renderTalkBlock(story) {
  if (Array.isArray(story.questions) && story.questions.length) {
    const items = story.questions
      .map((item) => `              <li>${escapeHtml(item)}</li>`)
      .join("\n");

    return `            <p class="talk-lead">Tri otázky, ktoré pomôžu rodičovi prebrať príbeh s dieťaťom.</p>
            <ol class="talk-list">
${items}
            </ol>`;
  }

  return `            <p class="talk-lead">Otázky pre rodičov budú doplnené neskôr.</p>`;
}

function renderRelatedCard(story, category) {
  const fileName = fileNameFromUrl(story.url);

  return `            <article class="story-card">
              <a class="story-card-link" href="${escapeHtml(fileName)}" aria-label="Čítať rozprávku ${escapeHtml(story.title)}">
                <div class="story-media ${escapeHtml(story.image)}" aria-hidden="true">
                  <span class="story-media-label">Priestor pre ilustráciu</span>
                </div>
                <div class="story-body">
                  <span class="chip ${escapeHtml(category.chip)}">${escapeHtml(category.name)}</span>
                  <h3>${escapeHtml(story.title)}</h3>
                  <p>${escapeHtml(story.description)}</p>
                  <p class="story-meta">
                    <span>Vek: ${escapeHtml(story.age)}</span>
                    <span>Čas: ${escapeHtml(story.readingTime)}</span>
                  </p>
                  <span class="story-cta">Čítať rozprávku</span>
                </div>
              </a>
            </article>`;
}

function renderRelatedCards(current, stories, categories) {
  const related = stories.filter(
    (story) => story.category === current.category && story.url !== current.url
  );

  return related
    .map((story) => renderRelatedCard(story, categories[story.category]))
    .join("\n\n");
}

function renderPager(current, stories) {
  const index = stories.findIndex((story) => story.url === current.url);
  const previous = index > 0 ? stories[index - 1] : null;
  const next = index < stories.length - 1 ? stories[index + 1] : null;
  const links = [];

  if (previous) {
    links.push(
      `          <a class="story-pager-link" href="${escapeHtml(fileNameFromUrl(previous.url))}">← Predchádzajúca rozprávka</a>`
    );
  }

  if (next) {
    links.push(
      `          <a class="story-pager-link story-pager-next" href="${escapeHtml(fileNameFromUrl(next.url))}">Ďalšia rozprávka →</a>`
    );
  }

  return links.join("\n");
}

function applyTemplate(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`Chýba hodnota pre token ${match}`);
    }

    return values[key];
  });
}

function updateCatalogLinks(stories) {
  const replacements = [
    {
      file: path.join(ROOT, "stories", "index.html"),
      prefix: ""
    },
    {
      file: path.join(ROOT, "index.html"),
      prefix: "stories/"
    },
    {
      file: path.join(ROOT, "categories", "ludske-telo.html"),
      prefix: "../stories/"
    },
    {
      file: path.join(ROOT, "categories", "priroda.html"),
      prefix: "../stories/"
    },
    {
      file: path.join(ROOT, "categories", "vesmir.html"),
      prefix: "../stories/"
    },
    {
      file: path.join(ROOT, "categories", "emocie.html"),
      prefix: "../stories/"
    },
    {
      file: path.join(ROOT, "categories", "veda.html"),
      prefix: "../stories/"
    }
  ];

  replacements.forEach(({ file, prefix }) => {
    let html = fs.readFileSync(file, "utf8");

    stories.forEach((story) => {
      const href = `${prefix}${fileNameFromUrl(story.url)}`;
      const title = story.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cardPattern = new RegExp(
        `href="#"(?=\\s+aria-label="Čítať rozprávku ${title}")`,
        "g"
      );

      html = html.replace(cardPattern, `href="${href}"`);
    });

    if (path.basename(file) === "index.html" && prefix === "stories/") {
      html = html.replace(
        '<a class="text-link" href="#">Zobraziť všetky</a>',
        '<a class="text-link" href="stories/index.html">Zobraziť všetky</a>'
      );
    }

    const featured = {
      "ludske-telo.html": "preco-musime-spat.html",
      "priroda.html": "ako-vznika-duha.html",
      "vesmir.html": "preco-svieti-mesiac.html",
      "emocie.html": "kam-sa-schovava-strach.html",
      "veda.html": "kuzelny-magnet.html"
    };
    const featuredFile = featured[path.basename(file)];

    if (featuredFile) {
      html = html.replace(
        '<a class="btn btn-primary" href="#">Prečítať teraz</a>',
        `<a class="btn btn-primary" href="../stories/${featuredFile}">Prečítať teraz</a>`
      );
    }

    fs.writeFileSync(file, html);
  });
}

function assertGeneratedPages(stories) {
  const missing = [];
  const missingMarkers = [];

  stories.forEach((story) => {
    const fileName = fileNameFromUrl(story.url);
    const filePath = path.join(OUTPUT_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      missing.push(fileName);
      return;
    }

    const html = fs.readFileSync(filePath, "utf8");

    if (!html.includes("<!-- STORY CONTENT START -->") || !html.includes("<!-- STORY CONTENT END -->")) {
      missingMarkers.push(fileName);
    }

    if (!html.includes("../styles.css") || !html.includes("../script.js")) {
      throw new Error(`${fileName} nemá správne cesty na CSS alebo JS.`);
    }
  });

  if (missing.length) {
    throw new Error(`Chýbajú vygenerované súbory: ${missing.join(", ")}`);
  }

  if (missingMarkers.length) {
    throw new Error(`Chýbajú značky obsahu v: ${missingMarkers.join(", ")}`);
  }
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const categories = data.categories;
  const stories = data.stories;

  if (!Array.isArray(stories) || stories.length !== 20) {
    throw new Error(`Očakáva sa 20 rozprávok v stories.json, nájdených: ${stories.length}`);
  }

  stories.forEach((story) => {
    if (!categories[story.category]) {
      throw new Error(`Neznáma kategória ${story.category} pri ${story.title}`);
    }

    const required = ["title", "category", "description", "age", "readingTime", "image", "url"];
    required.forEach((field) => {
      if (!story[field]) {
        throw new Error(`Rozprávke ${story.title || story.url} chýba pole ${field}`);
      }
    });
  });

  stories.forEach((story) => {
    const category = categories[story.category];
    const slug = slugFromUrl(story.url);
    const title = escapeHtml(story.title);
    const description = escapeHtml(story.description);
    const pageTitle = `${title} | Rozprávková Akadémia`;
    const metaDescription = escapeHtml(seoDescription(story, category));

    const html = applyTemplate(template, {
      PAGE_TITLE: pageTitle,
      META_DESCRIPTION: metaDescription,
      OG_TITLE: pageTitle,
      OG_DESCRIPTION: metaDescription,
      CANONICAL_URL: `https://example.com/stories/${slug}.html`,
      CATEGORY_URL: escapeHtml(category.url),
      CATEGORY_NAME: escapeHtml(category.name),
      CATEGORY_CHIP: escapeHtml(category.chip),
      CATEGORY_EMOJI: category.emoji,
      STORY_TITLE: title,
      STORY_DESCRIPTION: description,
      STORY_AGE: escapeHtml(story.age),
      STORY_READING_TIME: escapeHtml(story.readingTime),
      STORY_IMAGE: escapeHtml(story.image),
      STORY_CONTENT: loadStoryContent(slug),
      LEARN_BLOCK: renderLearnBlock(story),
      TALK_BLOCK: renderTalkBlock(story),
      RELATED_LEAD: escapeHtml(category.relatedLead),
      RELATED_CARDS: renderRelatedCards(story, stories, categories),
      PAGER_LINKS: renderPager(story, stories)
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html);
  });

  updateCatalogLinks(stories);
  assertGeneratedPages(stories);

  console.log(`Vygenerovaných ${stories.length} HTML stránok rozprávok zo stories.json.`);
}

main();
