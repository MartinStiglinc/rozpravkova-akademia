import {
  filterStories,
  getCategories,
  loadStories,
  renderLoadError,
  renderStoryCards,
  slugify,
  storyCountLabel
} from "./stories.js";

function fillSelect(select, values, blankLabel) {
  if (!select) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = blankLabel;
  fragment.appendChild(blank);

  values.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    fragment.appendChild(option);
  });

  select.replaceChildren(fragment);
}

function ageFilterOptions(stories) {
  let min = Infinity;
  let max = -Infinity;

  stories.forEach((story) => {
    const parts = String(story.age || "").match(/\d+/g);

    if (!parts || parts.length < 2) {
      return;
    }

    min = Math.min(min, Number(parts[0]));
    max = Math.max(max, Number(parts[1]));
  });

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return [];
  }

  const options = [];

  for (let start = min; start < max; start += 2) {
    const end = Math.min(start + 2, max);
    options.push({
      value: start + "-" + end,
      label: start + " až " + end + " rokov"
    });

    if (end === max) {
      break;
    }
  }

  return options;
}

function applyFiltersFromURL(ageSelect, categorySelect, queryInput) {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("kategoria") || params.get("category") || "";
  const age = params.get("vek") || params.get("age") || "";
  const query = params.get("q") || "";

  function hasOption(select, value) {
    return Boolean(select && Array.prototype.some.call(select.options, (option) => option.value === value));
  }

  if (categorySelect && category && hasOption(categorySelect, category)) {
    categorySelect.value = category;
  }

  if (ageSelect && age && hasOption(ageSelect, age)) {
    ageSelect.value = age;
  }

  if (queryInput && query) {
    queryInput.value = query;
  }
}

async function initCatalog() {
  const form = document.getElementById("story-filters");
  const grid = document.querySelector("[data-stories-grid='catalog']");
  const ageSelect = document.getElementById("filter-age");
  const categorySelect = document.getElementById("filter-category");
  const queryInput = document.getElementById("filter-query");
  const countEl = document.getElementById("results-count");
  const emptyEl = document.getElementById("stories-empty");
  const totalEl = document.getElementById("library-total-count");

  if (!grid) {
    return;
  }

  let stories = [];

  function applyStoryFilters() {
    const visible = filterStories(stories, {
      category: categorySelect ? categorySelect.value : "",
      age: ageSelect ? ageSelect.value : "",
      query: queryInput ? queryInput.value : ""
    });

    renderStoryCards(grid, visible, { cta: "Čítať rozprávku" });

    if (countEl) {
      countEl.textContent = String(visible.length);
    }

    if (emptyEl) {
      emptyEl.hidden = visible.length !== 0;
    }
  }

  try {
    stories = await loadStories();

    fillSelect(
      categorySelect,
      getCategories(stories).map((name) => ({ value: slugify(name), label: name })),
      "Všetky kategórie"
    );

    fillSelect(ageSelect, ageFilterOptions(stories), "Všetky vekové kategórie");

    if (totalEl) {
      totalEl.textContent = storyCountLabel(stories.length);
    }

    applyFiltersFromURL(ageSelect, categorySelect, queryInput);
    applyStoryFilters();
  } catch (error) {
    renderLoadError("[data-stories-grid='catalog']");

    if (totalEl) {
      totalEl.textContent = storyCountLabel(0);
    }

    if (countEl) {
      countEl.textContent = "0";
    }

    if (emptyEl) {
      emptyEl.hidden = true;
    }

    return;
  }

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applyStoryFilters();
  });

  form.addEventListener("input", applyStoryFilters);
  form.addEventListener("change", applyStoryFilters);

  form.addEventListener("reset", (event) => {
    event.preventDefault();

    if (ageSelect) {
      ageSelect.value = "";
    }

    if (categorySelect) {
      categorySelect.value = "";
    }

    if (queryInput) {
      queryInput.value = "";
    }

    applyStoryFilters();
  });
}

initCatalog();
