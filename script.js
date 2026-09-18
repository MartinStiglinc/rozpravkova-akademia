(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");

  root.classList.remove("no-js");

  if (!toggle || !menu) {
    return;
  }

  var desktopQuery = window.matchMedia("(min-width: 1024px)");

  function getFocusable() {
    return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
  }

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Zatvoriť menu" : "Otvoriť menu");
    menu.hidden = !open;
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);

    if (open) {
      var firstLink = menu.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  toggle.addEventListener("click", function () {
    setOpen(!isOpen());
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen()) {
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var focusable = getFocusable().filter(function (el) {
      return !el.hidden && el.offsetParent !== null;
    });

    if (!focusable.length) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (!isOpen()) {
      return;
    }

    if (toggle.contains(event.target) || menu.contains(event.target)) {
      return;
    }

    setOpen(false);
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  function handleBreakpointChange() {
    if (desktopQuery.matches && isOpen()) {
      setOpen(false);
    }
  }

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", handleBreakpointChange);
  } else if (typeof desktopQuery.addListener === "function") {
    desktopQuery.addListener(handleBreakpointChange);
  }
})();

(function () {
  var form = document.getElementById("story-filters");
  var grid = document.getElementById("stories-grid");

  if (!form || !grid) {
    return;
  }

  var ageSelect = document.getElementById("filter-age");
  var categorySelect = document.getElementById("filter-category");
  var queryInput = document.getElementById("filter-query");
  var countEl = document.getElementById("results-count");
  var emptyEl = document.getElementById("stories-empty");
  var totalEl = document.getElementById("library-total-count");
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".story-card"));

  function storyCountLabel(count) {
    var mod100 = count % 100;
    var mod10 = count % 10;

    if (count === 1) {
      return "1 rozprávka";
    }

    if (mod100 >= 11 && mod100 <= 14) {
      return count + " rozprávok";
    }

    if (mod10 >= 2 && mod10 <= 4) {
      return count + " rozprávky";
    }

    return count + " rozprávok";
  }

  function normalizeText(value) {
    return String(value || "")
      .toLocaleLowerCase("sk")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseAgeRange(value) {
    var nums = String(value || "").match(/\d+/g);

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

  function matchesAge(card, filterValue) {
    if (!filterValue) {
      return true;
    }

    var filterRange = parseAgeRange(filterValue);
    var cardRange = parseAgeRange(card.getAttribute("data-age"));

    if (!filterRange || !cardRange) {
      return false;
    }

    return rangesOverlap(cardRange, filterRange);
  }

  function matchesCategory(card, filterValue) {
    if (!filterValue) {
      return true;
    }

    return card.getAttribute("data-category") === filterValue;
  }

  function matchesQuery(card, query) {
    var needle = normalizeText(query);

    if (!needle) {
      return true;
    }

    var title = normalizeText(card.getAttribute("data-title"));
    var descriptionNode = card.querySelector(".story-body > p:not(.story-meta)");
    var description = normalizeText(descriptionNode ? descriptionNode.textContent : "");

    return title.indexOf(needle) !== -1 || description.indexOf(needle) !== -1;
  }

  function applyStoryFilters() {
    var age = ageSelect ? ageSelect.value : "";
    var category = categorySelect ? categorySelect.value : "";
    var query = queryInput ? queryInput.value : "";
    var visible = 0;

    cards.forEach(function (card) {
      var show =
        matchesAge(card, age) &&
        matchesCategory(card, category) &&
        matchesQuery(card, query);

      card.hidden = !show;

      if (show) {
        visible += 1;
      }
    });

    if (countEl) {
      countEl.textContent = String(visible);
    }

    if (emptyEl) {
      emptyEl.hidden = visible !== 0;
    }
  }

  function hasOption(select, value) {
    return Array.prototype.some.call(select.options, function (option) {
      return option.value === value;
    });
  }

  function applyFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);
    var category = params.get("kategoria") || params.get("category") || "";
    var age = params.get("vek") || params.get("age") || "";
    var query = params.get("q") || "";

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

  function resetStoryFilters() {
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
  }

  if (totalEl) {
    totalEl.textContent = storyCountLabel(cards.length);
  }

  applyFiltersFromURL();
  applyStoryFilters();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    applyStoryFilters();
  });

  form.addEventListener("input", applyStoryFilters);
  form.addEventListener("change", applyStoryFilters);

  form.addEventListener("reset", function (event) {
    event.preventDefault();
    resetStoryFilters();
  });
})();
