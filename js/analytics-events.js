(function () {
  var root = window.RozpravkovaAkademia = window.RozpravkovaAkademia || {};
  var stories = [];
  var currentStory = null;
  var storyOpenSent = false;
  var storyCompleteSent = false;
  var storyCompleteReached = false;
  var progressBound = false;

  function storiesUrl() {
    var path = window.location.pathname || "";

    if (/\/(?:stories|categories)\//.test(path)) {
      return "../data/stories.json?v=20";
    }

    return "data/stories.json?v=20";
  }

  function canTrack() {
    return root.analyticsConsent === true && typeof window.gtag === "function";
  }

  function track(name, params) {
    var payload = { transport_type: "beacon" };
    var key;

    if (!canTrack()) {
      return false;
    }

    if (params) {
      for (key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          payload[key] = params[key];
        }
      }
    }

    window.gtag("event", name, payload);
    return true;
  }

  function storyParams(story) {
    return {
      story_name: story.title,
      category: story.category
    };
  }

  function currentSlug() {
    var path = (window.location.pathname || "").replace(/\\/g, "/");
    var match = path.match(/\/stories\/([a-z0-9-]+)\.html$/i);

    if (!match || match[1] === "story" || match[1] === "index") {
      return "";
    }

    return match[1].toLowerCase();
  }

  function findBySlug(slug) {
    var i;

    for (i = 0; i < stories.length; i += 1) {
      if (String(stories[i].slug || "").toLowerCase() === slug) {
        return stories[i];
      }
    }

    return null;
  }

  function knownCategory(name) {
    var i;

    if (!name) {
      return "";
    }

    for (i = 0; i < stories.length; i += 1) {
      if (stories[i].category === name) {
        return name;
      }
    }

    return "";
  }

  function flushStoryOpen() {
    if (storyOpenSent || !currentStory) {
      return;
    }

    if (track("story_open", storyParams(currentStory))) {
      storyOpenSent = true;
    }
  }

  function flushStoryComplete() {
    if (storyCompleteSent || !storyCompleteReached || !currentStory) {
      return;
    }

    if (track("story_complete", storyParams(currentStory))) {
      storyCompleteSent = true;
    }
  }

  function storyProgress() {
    var article = document.querySelector(".page-story .story-prose");
    var rect;
    var seen;

    if (!article) {
      return 0;
    }

    rect = article.getBoundingClientRect();

    if (rect.height <= 0) {
      return 0;
    }

    seen = window.innerHeight - rect.top;
    return seen / rect.height;
  }

  function checkStoryProgress() {
    if (!currentStory || storyCompleteSent) {
      return;
    }

    if (storyProgress() >= 0.9) {
      storyCompleteReached = true;
      flushStoryComplete();
    }
  }

  function bindStoryProgress() {
    if (progressBound || !currentStory) {
      return;
    }

    progressBound = true;
    window.addEventListener("scroll", checkStoryProgress, { passive: true });
    window.addEventListener("resize", checkStoryProgress);
    checkStoryProgress();
  }

  function nextStorySlug(link) {
    var href = link.getAttribute("href") || "";
    var path = href.split("#")[0].split("?")[0];
    var match = path.match(/^([a-z0-9-]+)\.html$/i);

    if (!match || match[1] === "index" || match[1] === "story") {
      return "";
    }

    return match[1].toLowerCase();
  }

  function eventTarget(event) {
    var target = event.target;

    if (target && target.nodeType === 3) {
      target = target.parentElement;
    }

    return target && target.closest ? target : null;
  }

  function onClick(event) {
    var target = eventTarget(event);
    var nextLink = target ? target.closest("a.story-pager-next") : null;
    var categoryLink = target ? target.closest("a.category-card[data-category-name]") : null;
    var category;
    var nextSlug;
    var nextStory;
    var params;

    if (nextLink && currentStory) {
      nextSlug = nextStorySlug(nextLink);

      if (nextSlug) {
        params = storyParams(currentStory);
        nextStory = findBySlug(nextSlug);

        if (nextStory) {
          params.next_story_name = nextStory.title;
        }

        track("next_story_click", params);
      }
    }

    if (categoryLink) {
      category = knownCategory(categoryLink.getAttribute("data-category-name"));

      if (category) {
        track("category_click", { category: category });
      }
    }
  }

  function onChange(event) {
    var select = event.target;
    var option;
    var category;

    if (!select || select.id !== "filter-category") {
      return;
    }

    option = select.options[select.selectedIndex];
    category = knownCategory(option ? option.textContent.replace(/\s+/g, " ").trim() : "");

    if (category) {
      track("category_click", { category: category });
    }
  }

  function onStories(data) {
    stories = Array.isArray(data) ? data : [];
    currentStory = findBySlug(currentSlug());
    flushStoryOpen();
    bindStoryProgress();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);

  if (typeof root.onAnalyticsConsentChange === "function") {
    root.onAnalyticsConsentChange(function () {
      flushStoryOpen();
      flushStoryComplete();
    });
  }

  fetch(storiesUrl())
    .then(function (response) {
      if (!response.ok) {
        throw new Error("stories");
      }

      return response.json();
    })
    .then(onStories)
    .catch(function () {
      stories = [];
      currentStory = null;
    });
})();
