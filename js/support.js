(function () {
  /**
   * Cieľ tlačidiel podpory je stránka support.html.
   * Relatívna cesta funguje z koreňa aj z priečinkov stories/ a categories/.
   */
  var SUPPORT_LABELS = [
    "Podporiť projekt",
    "Podporte projekt",
    "Podporte nás",
    "Podpora projektu"
  ];

  var ARIA_LABEL = "Podporiť projekt. Otvorí stránku s možnosťami podpory.";
  var TITLE = "Podporiť projekt";

  function supportPageHref() {
    var path = window.location.pathname || "";

    if (/\/(?:stories|categories)\//.test(path)) {
      return "../support.html";
    }

    return "support.html";
  }

  function isSupportLink(link) {
    if (!link || link.tagName !== "A") {
      return false;
    }

    if (link.hasAttribute("data-support-cta")) {
      return true;
    }

    var text = (link.textContent || "").replace(/\s+/g, " ").trim();
    return SUPPORT_LABELS.indexOf(text) !== -1;
  }

  function trackSupportClick() {
    var params = {
      page_title: document.title,
      page_path: window.location.pathname
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "support_project_click", params);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "support_project_click",
      page_title: params.page_title,
      page_path: params.page_path
    });
  }

  function enhanceSupportLink(link) {
    link.href = supportPageHref();
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.setAttribute("aria-label", ARIA_LABEL);
    link.title = TITLE;
    link.classList.add("support-cta");

    if (link.getAttribute("data-support-bound") === "true") {
      return;
    }

    link.setAttribute("data-support-bound", "true");
    link.addEventListener("click", trackSupportClick);
  }

  function enhanceSupportLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll("a");

    for (var i = 0; i < links.length; i += 1) {
      if (isSupportLink(links[i])) {
        enhanceSupportLink(links[i]);
      }
    }
  }

  window.RozpravkovaAkademia = window.RozpravkovaAkademia || {};
  window.RozpravkovaAkademia.supportPageUrl = supportPageHref();
  window.RozpravkovaAkademia.enhanceSupportLinks = enhanceSupportLinks;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceSupportLinks(document);
    });
  } else {
    enhanceSupportLinks(document);
  }
})();
