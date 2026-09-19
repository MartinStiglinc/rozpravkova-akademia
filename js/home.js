import {
  getFeaturedStories,
  getStats,
  loadStories,
  renderLoadError,
  renderStoryCards,
  updateCategoryCounts
} from "./stories.js";

function setStat(selector, value) {
  const el = document.querySelector(selector);

  if (el) {
    el.textContent = value;
  }
}

async function initHome() {
  const grid = document.querySelector("[data-stories-grid='featured']");

  try {
    const stories = await loadStories();
    const featured = getFeaturedStories(stories);
    const stats = getStats(stories);

    if (grid) {
      renderStoryCards(grid, featured, { cta: "Čítať rozprávku" });
    }

    setStat("[data-stat='stories']", String(stats.stories));
    setStat("[data-stat='categories']", String(stats.categories));
    setStat("[data-stat='featured']", String(stats.featured));

    updateCategoryCounts(stories);
  } catch (error) {
    renderLoadError(["[data-stories-grid='featured']", "[data-stats]"]);
  }
}

initHome();
