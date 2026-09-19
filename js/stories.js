const STORIES_URL = new URL("../data/stories.json", import.meta.url).href;
const CACHE_KEY = "ra-stories-cache-v1";
const LOAD_ERROR_TITLE = "Nepodarilo sa načítať rozprávky.";
const LOAD_ERROR_HINT = "Skúste obnoviť stránku.";

const CHIP_TONES = ["chip-blue", "chip-pink", "chip-green", "chip-purple", "chip-orange"];

const CATEGORY_CHIPS = {
  "Ľudské telo": "chip-blue",
  "Príroda": "chip-green",
  "Vesmír": "chip-purple",
  "Emócie": "chip-pink",
  "Veda": "chip-orange"
};

const MEDIA_BY_SLUG = {
  "preco-musime-spat": "media-sleep",
  "ako-funguje-srdce": "media-heart",
  "preco-si-umyvame-zuby": "media-teeth",
  "ako-telo-bojuje-proti-chorobam": "media-immune",
  "preco-prsi": "media-rain",
  "ako-vznika-duha": "media-rainbow",
  "tajomstvo-vciel": "media-bees",
  "kam-miznu-listy-na-jesen": "media-leaves",
  "preco-svieti-mesiac": "media-moon",
  "ako-vznika-den-a-noc": "media-daynight",
  "vyprava-na-mars": "media-mars",
  "cesta-okolo-slnka": "media-sun",
  "kam-sa-schovava-strach": "media-fear",
  "hnevak-a-pokojna-riecka": "media-anger",
  "tajomstvo-kamaratstva": "media-friendship",
  "dievcatko-ktore-sa-balo-skolky": "media-kindergarten",
  "kuzelny-magnet": "media-magnet",
  "ako-lietaju-lietadla": "media-planes",
  "dobrodruzstvo-malej-kvapky-elektriny": "media-electricity",
  "preco-sa-topi-lad": "media-ice"
};

let memoryCache = null;
let inflightRequest = null;

function siteRootPrefix() {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.includes("/stories/") || path.includes("/categories/")) {
    return "../";
  }
  return "";
}

export function resolveSitePath(path) {
  if (!path) {
    return "#";
  }

  if (/^(https?:|mailto:|tel:|#)/i.test(path)) {
    return path;
  }

  return siteRootPrefix() + String(path).replace(/^\//, "");
}

export function slugify(value) {
  return String(value || "")
    .toLocaleLowerCase("sk")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("sk")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pluralForm(count, forms) {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (count === 1) {
    return forms.one;
  }

  if (mod100 >= 11 && mod100 <= 14) {
    return forms.many;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return forms.few;
  }

  return forms.many;
}

export function storyCountLabel(count) {
  return count + " " + pluralForm(count, {
    one: "rozprávka",
    few: "rozprávky",
    many: "rozprávok"
  });
}

export function categoryCountLabel(count) {
  return count + " " + pluralForm(count, {
    one: "kategória",
    few: "kategórie",
    many: "kategórií"
  });
}

export function featuredCountLabel(count) {
  return count + " " + pluralForm(count, {
    one: "odporúčaná rozprávka",
    few: "odporúčané rozprávky",
    many: "odporúčaných rozprávok"
  });
}

function parseAgeRange(value) {
  const nums = String(value || "").match(/\d+/g);

  if (!nums || nums.length < 2) {
    return null;
  }

  return {
    min: Number(nums[0]),
    max: Number(nums[1])
  };
}

function rangesOverlap(first, second) {
  return first.min <= second.max && second.min <= first.max;
}

export function formatAgeLabel(age) {
  const range = parseAgeRange(age);

  if (!range) {
    return "Vek: " + age;
  }

  return "Vek: " + range.min + " až " + range.max + " rokov";
}

export function formatReadingTime(readingTime) {
  const match = String(readingTime || "").match(/\d+/);

  if (!match) {
    return "Čas: " + readingTime;
  }

  const minutes = Number(match[0]);
  return "Čas: " + minutes + " " + pluralForm(minutes, {
    one: "minúta",
    few: "minúty",
    many: "minút"
  });
}

export function chipClassForCategory(category) {
  if (CATEGORY_CHIPS[category]) {
    return CATEGORY_CHIPS[category];
  }

  const slug = slugify(category);
  let hash = 0;

  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % CHIP_TONES.length;
  }

  return CHIP_TONES[hash];
}

export function mediaClassForStory(story) {
  return MEDIA_BY_SLUG[story.slug] || "media-default";
}

function readSessionCache() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function writeSessionCache(stories) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(stories));
  } catch (error) {
    // Private mode or full storage should not break the page.
  }
}

export async function loadStories() {
  if (memoryCache) {
    return memoryCache;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const cached = readSessionCache();

    if (cached) {
      memoryCache = cached;
      return memoryCache;
    }

    const response = await fetch(STORIES_URL, { cache: "force-cache" });

    if (!response.ok) {
      throw new Error("Stories JSON could not be loaded");
    }

    const data = await response.json();
    const stories = Array.isArray(data) ? data : data.stories;

    if (!Array.isArray(stories)) {
      throw new Error("Stories JSON has an unexpected shape");
    }

    writeSessionCache(stories);
    memoryCache = stories;
    return memoryCache;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}

export function getCategories(stories) {
  const seen = new Set();
  const categories = [];

  stories.forEach((story) => {
    if (!story.category || seen.has(story.category)) {
      return;
    }

    seen.add(story.category);
    categories.push(story.category);
  });

  return categories;
}

export function getFeaturedStories(stories) {
  return stories.filter((story) => story.featured === true);
}

export function getStoriesByCategory(stories, category) {
  return stories.filter((story) => story.category === category);
}

export function getStats(stories) {
  return {
    stories: stories.length,
    categories: getCategories(stories).length,
    featured: getFeaturedStories(stories).length
  };
}

export function storyMatchesQuery(story, query) {
  const needle = normalizeText(query);

  if (!needle) {
    return true;
  }

  const haystack = [story.title, story.description, story.category]
    .map(normalizeText)
    .join(" ");

  return haystack.indexOf(needle) !== -1;
}

export function storyMatchesAge(story, filterValue) {
  if (!filterValue) {
    return true;
  }

  const filterRange = parseAgeRange(filterValue);
  const storyRange = parseAgeRange(story.age);

  if (!filterRange || !storyRange) {
    return false;
  }

  return rangesOverlap(storyRange, filterRange);
}

export function filterStories(stories, filters) {
  const category = filters && filters.category ? filters.category : "";
  const age = filters && filters.age ? filters.age : "";
  const query = filters && filters.query ? filters.query : "";

  return stories.filter((story) => {
    const categoryMatch = !category || slugify(story.category) === category || story.category === category;
    return categoryMatch && storyMatchesAge(story, age) && storyMatchesQuery(story, query);
  });
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (text) {
    el.textContent = text;
  }

  return el;
}

export function createStoryCard(story, options) {
  const settings = options || {};
  const article = createEl("article", "story-card");
  const link = createEl("a", "story-card-link");
  const media = createEl("div", "story-media " + mediaClassForStory(story));
  const body = createEl("div", "story-body");
  const meta = createEl("p", "story-meta");

  article.dataset.category = slugify(story.category);
  article.dataset.age = story.age;
  article.dataset.title = story.title;

  link.href = resolveSitePath(story.url);
  link.setAttribute("aria-label", "Čítať rozprávku " + story.title);

  media.setAttribute("aria-hidden", "true");

  if (story.image) {
    const image = document.createElement("img");
    image.src = resolveSitePath(story.image);
    image.alt = "";
    image.addEventListener("error", function () {
      image.remove();
    });
    media.appendChild(image);
  }

  media.appendChild(createEl("span", "story-media-label", "Priestor pre ilustráciu"));

  body.appendChild(createEl("span", "chip " + chipClassForCategory(story.category), story.category));
  body.appendChild(createEl("h3", "", story.title));
  body.appendChild(createEl("p", "", story.description));

  meta.appendChild(createEl("span", "", formatAgeLabel(story.age)));
  meta.appendChild(createEl("span", "", formatReadingTime(story.readingTime)));
  body.appendChild(meta);
  body.appendChild(createEl("span", "story-cta", settings.cta || "Čítať rozprávku"));

  link.appendChild(media);
  link.appendChild(body);
  article.appendChild(link);

  return article;
}

export function renderStoryCards(container, stories, options) {
  if (!container) {
    return;
  }

  const fragment = document.createDocumentFragment();

  stories.forEach((story) => {
    fragment.appendChild(createStoryCard(story, options));
  });

  container.replaceChildren(fragment);
}

export function showStoriesError(target) {
  const host = typeof target === "string" ? document.querySelector(target) : target;

  if (!host) {
    return;
  }

  const box = createEl("div", "stories-error");
  box.setAttribute("role", "alert");
  box.appendChild(createEl("p", "stories-error-title", LOAD_ERROR_TITLE));
  box.appendChild(createEl("p", "", LOAD_ERROR_HINT));
  host.replaceChildren(box);
}

export function updateCategoryCounts(stories) {
  const counts = {};

  stories.forEach((story) => {
    counts[story.category] = (counts[story.category] || 0) + 1;
  });

  document.querySelectorAll("[data-category-name]").forEach((el) => {
    const name = el.getAttribute("data-category-name");
    const count = counts[name] || 0;
    const label = storyCountLabel(count);

    if (el.tagName === "A") {
      el.setAttribute("aria-label", "Kategória " + name + ", " + label);
      return;
    }

    el.textContent = label;
  });
}

export function renderLoadError(selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  let shown = false;

  list.forEach((selector) => {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;

    if (!el) {
      return;
    }

    showStoriesError(el);
    shown = true;
  });

  if (!shown) {
    const fallback = document.querySelector("main") || document.body;
    showStoriesError(fallback);
  }
}
