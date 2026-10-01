(function () {
  var SHARE_FALLBACK_MESSAGE = "Odkaz na rozprávku bol skopírovaný.";
  var COPY_MESSAGE = "Nakopírované do schránky.";
  var COPY_ERROR_MESSAGE = "Odkaz sa nepodarilo skopírovať. Skúste to znova.";
  var STATUS_HIDE_MS = 4000;
  var statusTimer = 0;

  if (!document.body || !document.body.classList.contains("page-story")) {
    return;
  }

  if (document.querySelector(".section-share")) {
    return;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function storyTitle() {
    var heading = document.getElementById("story-title");
    var title;

    if (heading) {
      title = cleanText(heading.textContent);

      if (title) {
        return title;
      }
    }

    title = cleanText(document.title).replace(/\s*\|\s*Rozprávková Akadémia\s*$/i, "");
    return title || "Rozprávka";
  }

  function storyText() {
    var lead = document.querySelector(".story-hero-lead");
    var meta = document.querySelector('meta[name="description"]');
    var text = lead ? cleanText(lead.textContent) : "";

    if (text) {
      return text;
    }

    return meta ? cleanText(meta.getAttribute("content")) : "";
  }

  function storyUrl() {
    var canonical = document.querySelector('link[rel="canonical"]');
    var href = canonical ? cleanText(canonical.getAttribute("href")) : "";

    if (/^https?:\/\//i.test(href)) {
      return href.split("#")[0];
    }

    return window.location.href.split("#")[0];
  }

  function storySlug() {
    var path = (window.location.pathname || "").replace(/\\/g, "/");
    var match = path.match(/\/([a-z0-9-]+)\.html$/i);

    if (!match || match[1].toLowerCase() === "index") {
      return "";
    }

    return match[1].toLowerCase();
  }

  function shareData() {
    return {
      title: storyTitle(),
      text: storyText(),
      url: storyUrl()
    };
  }

  function analyticsParams() {
    return {
      story_name: storyTitle(),
      story_slug: storySlug(),
      story_url: storyUrl()
    };
  }

  function track(name) {
    var api = window.RozpravkovaAkademia;
    var params = analyticsParams();
    var payload = { transport_type: "beacon" };
    var key;

    if (!api || api.analyticsConsent !== true || typeof window.gtag !== "function") {
      return;
    }

    for (key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        payload[key] = params[key];
      }
    }

    window.gtag("event", name, payload);
  }

  function canNativeShare(data) {
    if (!navigator.share || typeof navigator.share !== "function") {
      return false;
    }

    if (typeof navigator.canShare !== "function") {
      return true;
    }

    try {
      return navigator.canShare(data) === true;
    } catch (error) {
      return false;
    }
  }

  function copyWithTextarea(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      var selected;

      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();

      try {
        selected = document.execCommand("copy");
      } catch (error) {
        document.body.removeChild(area);
        reject(error);
        return;
      }

      document.body.removeChild(area);

      if (selected) {
        resolve();
      } else {
        reject(new Error("copy"));
      }
    });
  }

  function copyUrl() {
    var url = storyUrl();

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(url).catch(function () {
        return copyWithTextarea(url);
      });
    }

    return copyWithTextarea(url);
  }

  function showStatus(status, message) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = window.setTimeout(function () {
      status.textContent = "";
    }, STATUS_HIDE_MS);
  }

  function setBusy(button, busy) {
    button.disabled = busy;
    button.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function mountShare() {
    var related = document.querySelector("main .section-related");
    var footer = document.querySelector("footer.site-footer");
    var main = document.querySelector("main");
    var parent;
    var before;
    var section = document.createElement("section");
    var narrow = document.createElement("div");
    var panel = document.createElement("div");
    var heading = document.createElement("h2");
    var lead = document.createElement("p");
    var actions = document.createElement("div");
    var shareButton = document.createElement("button");
    var shareIcon = document.createElement("span");
    var copyButton = document.createElement("button");
    var copyIcon = document.createElement("span");
    var status = document.createElement("p");

    if (related && related.parentNode) {
      parent = related.parentNode;
      before = related;
    } else if (footer && footer.parentNode) {
      parent = footer.parentNode;
      before = footer;
    } else if (main) {
      parent = main;
      before = null;
    } else {
      return;
    }

    section.className = "section section-share";
    section.setAttribute("aria-labelledby", "share-story-heading");
    narrow.className = "story-narrow";
    panel.className = "share-panel";

    heading.id = "share-story-heading";
    heading.textContent = "Páčila sa vám táto rozprávka?";

    lead.textContent = "Pomôžte nám dostať tento príbeh aj k ďalším deťom.";

    actions.className = "share-actions";

    shareButton.type = "button";
    shareButton.className = "btn btn-primary share-story-btn";
    shareButton.setAttribute("aria-label", "Zdieľať rozprávku");
    shareIcon.setAttribute("aria-hidden", "true");
    shareIcon.textContent = "📤";
    shareButton.appendChild(shareIcon);
    shareButton.appendChild(document.createTextNode("Zdieľať rozprávku"));

    copyButton.type = "button";
    copyButton.className = "share-copy-btn";
    copyButton.setAttribute("aria-label", "Skopírovať odkaz na rozprávku");
    copyIcon.setAttribute("aria-hidden", "true");
    copyIcon.textContent = "🔗";
    copyButton.appendChild(copyIcon);
    copyButton.appendChild(document.createTextNode("Skopírovať odkaz"));

    status.className = "share-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    actions.appendChild(shareButton);
    actions.appendChild(copyButton);
    panel.appendChild(heading);
    panel.appendChild(lead);
    panel.appendChild(actions);
    panel.appendChild(status);
    narrow.appendChild(panel);
    section.appendChild(narrow);

    if (before) {
      parent.insertBefore(section, before);
    } else {
      parent.appendChild(section);
    }

    shareButton.addEventListener("click", function () {
      var data = shareData();

      setBusy(shareButton, true);

      if (canNativeShare(data)) {
        navigator.share(data).then(function () {
          track("share_story");
        }).catch(function (error) {
          if (error && error.name === "AbortError") {
            return;
          }

          return copyUrl().then(function () {
            showStatus(status, SHARE_FALLBACK_MESSAGE);
            track("share_story");
          });
        }).catch(function () {
          showStatus(status, COPY_ERROR_MESSAGE);
        }).then(function () {
          setBusy(shareButton, false);
        });
        return;
      }

      copyUrl().then(function () {
        showStatus(status, SHARE_FALLBACK_MESSAGE);
        track("share_story");
      }).catch(function () {
        showStatus(status, COPY_ERROR_MESSAGE);
      }).then(function () {
        setBusy(shareButton, false);
      });
    });

    copyButton.addEventListener("click", function () {
      setBusy(copyButton, true);

      copyUrl().then(function () {
        showStatus(status, COPY_MESSAGE);
        track("copy_story_link");
      }).catch(function () {
        showStatus(status, COPY_ERROR_MESSAGE);
      }).then(function () {
        setBusy(copyButton, false);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountShare);
  } else {
    mountShare();
  }
})();
