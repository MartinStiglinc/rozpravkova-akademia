import {
  formatAgeLabel,
  formatReadingTime,
  getFeaturedStories,
  getStoriesByCategory,
  loadStories,
  mediaClassForStory,
  renderLoadError,
  renderStoryCards,
  resolveSitePath,
  storyCountLabel,
  updateCategoryCounts
} from "./stories.js";

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

function renderFeaturedStory(container, story) {
  if (!container || !story) {
    return;
  }

  const article = createEl("article", "featured-story");
  const media = createEl("div", "featured-media story-cover " + mediaClassForStory(story));
  const copy = createEl("div", "featured-copy");
  const meta = createEl("p", "story-meta");
  const link = createEl("a", "btn btn-primary", "Prečítať teraz");

  media.setAttribute("aria-hidden", "true");
  media.setAttribute("data-illustration", story.slug + "-featured");

  if (story.image) {
    const image = document.createElement("img");
    image.src = resolveSitePath(story.image);
    image.alt = "";
    image.addEventListener("error", function () {
      image.remove();
    });
    media.appendChild(image);
  }

  media.appendChild(createEl("span", "story-cover-label", "Priestor pre ilustráciu"));

  copy.appendChild(createEl("p", "badge", "Najobľúbenejšia rozprávka tejto kategórie"));

  const heading = createEl("h2", "", story.title);
  heading.id = "featured-heading";
  copy.appendChild(heading);

  copy.appendChild(createEl("p", "", story.description));
  meta.appendChild(createEl("span", "", formatAgeLabel(story.age)));
  meta.appendChild(createEl("span", "", formatReadingTime(story.readingTime)));
  copy.appendChild(meta);

  link.href = resolveSitePath(story.url);
  copy.appendChild(link);

  article.appendChild(media);
  article.appendChild(copy);
  container.replaceChildren(article);
}

async function initCategory() {
  const page = document.querySelector("[data-category]");
  const categoryName = page ? page.getAttribute("data-category") : "";
  const grid = document.querySelector("[data-stories-grid='category']");
  const featuredHost = document.querySelector("[data-featured-story]");
  const countEls = document.querySelectorAll("[data-category-count]");

  if (!categoryName) {
    return;
  }

  try {
    const stories = await loadStories();
    const categoryStories = getStoriesByCategory(stories, categoryName);
    const featuredInCategory = getFeaturedStories(categoryStories);
    const featured = featuredInCategory[0] || categoryStories[0] || null;

    if (grid) {
      renderStoryCards(grid, categoryStories, { cta: "Čítať" });
    }

    renderFeaturedStory(featuredHost, featured);

    countEls.forEach((el) => {
      el.textContent = storyCountLabel(categoryStories.length);
    });

    updateCategoryCounts(stories);
  } catch (error) {
    renderLoadError(["[data-stories-grid='category']", "[data-featured-story]"]);
  }
}

initCategory();
