(function () {
  /**
   * Jediná adresa platobného odkazu Stripe.
   * Všetky tlačidlá „Podporiť projekt“ ju preberajú odtiaľto.
   */
  var STRIPE_PAYMENT_URL = "https://buy.stripe.com/test_7sY14o3sz2cf2Vr4XR2Ry00";

  var SUPPORT_LABEL = "Podporiť projekt";
  var ARIA_LABEL = "Podporiť projekt. Otvorí platobnú stránku Stripe v novom okne.";
  var TITLE = "Podporiť projekt cez Stripe (otvorí sa v novom okne)";

  function isSupportLink(link) {
    if (!link || link.tagName !== "A") {
      return false;
    }

    if (link.hasAttribute("data-support-cta")) {
      return true;
    }

    return (link.textContent || "").replace(/\s+/g, " ").trim() === SUPPORT_LABEL;
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
    link.href = STRIPE_PAYMENT_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
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
  window.RozpravkovaAkademia.stripePaymentUrl = STRIPE_PAYMENT_URL;
  window.RozpravkovaAkademia.enhanceSupportLinks = enhanceSupportLinks;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceSupportLinks(document);
    });
  } else {
    enhanceSupportLinks(document);
  }
})();
