(function () {
  var STORAGE_KEY = "ra-cookie-consent-v1";
  var GA_ID_PATTERN = /^G-[A-Z0-9]{8,12}$/;
  var root = window.RozpravkovaAkademia = window.RozpravkovaAkademia || {};
  var gaLoaded = false;
  var defaultConsentSet = false;
  var ui = null;
  var lastFocus = null;
  var consentListeners = [];

  function measurementId() {
    var id = window.RA_GA_MEASUREMENT_ID;

    if (typeof id !== "string") {
      return "";
    }

    id = id.trim();

    if (!GA_ID_PATTERN.test(id) || /X{4,}/.test(id)) {
      return "";
    }

    return id;
  }

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      var data = JSON.parse(raw);

      if (!data || (data.analytics !== true && data.analytics !== false)) {
        return null;
      }

      return data.analytics === true;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(granted) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        analytics: granted === true,
        updatedAt: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function pagePrefix() {
    var path = window.location.pathname || "";

    if (/\/(?:stories|categories)\//.test(path)) {
      return "../";
    }

    return "";
  }

  function clearGaCookies() {
    var cookies = document.cookie ? document.cookie.split(";") : [];

    cookies.forEach(function (part) {
      var name = part.split("=")[0].trim();

      if (name === "_ga" || name === "_gid" || name.indexOf("_ga_") === 0) {
        document.cookie = name + "=; Max-Age=0; path=/";
      }
    });
  }

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== "function") {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

  function setDefaultConsent() {
    if (defaultConsentSet || !measurementId()) {
      return;
    }

    defaultConsentSet = true;
    ensureGtagStub();
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted",
      wait_for_update: 500
    });
  }

  function loadAnalytics(id) {
    ensureGtagStub();
    window.gtag("consent", "update", {
      analytics_storage: "granted"
    });

    if (gaLoaded) {
      return;
    }

    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      gaLoaded = true;
      return;
    }

    gaLoaded = true;
    window.gtag("js", new Date());
    window.gtag("config", id, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function notifyConsent() {
    consentListeners.forEach(function (listener) {
      listener(root.analyticsConsent === true);
    });
  }

  function applyConsent(granted) {
    var id = measurementId();
    root.analyticsConsent = granted === true && !!id;

    if (root.analyticsConsent) {
      loadAnalytics(id);
      notifyConsent();
      return;
    }

    if (gaLoaded && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
    }

    clearGaCookies();
    notifyConsent();
  }

  function statusText() {
    if (!measurementId()) {
      return "Analytické meranie momentálne nie je zapnuté. Stránka nenačítava Google Analytics a neodosiela analytické údaje. Súhlas sa bude pýtať až vtedy, keď bude nastavené platné Measurement ID.";
    }

    if (root.analyticsConsent === true) {
      return "Analytické cookies sú povolené. Súhlas môžete kedykoľvek odvolať. Základný obsah stránky je dostupný aj bez nich.";
    }

    if (readConsent() === false) {
      return "Analytické cookies sú odmietnuté. Google Analytics sa nenačítava.";
    }

    return "Analytické cookies sú voliteľné. Bez súhlasu sa meranie nespustí a rozprávky zostanú dostupné.";
  }

  function syncDialog() {
    var configured = !!measurementId();
    var status = ui.dialog.querySelector("[data-cookie-status]");
    var choice = ui.dialog.querySelector("[data-cookie-choice]");
    var checkbox = ui.dialog.querySelector("[data-cookie-analytics]");
    var save = ui.dialog.querySelector("[data-cookie-save]");

    status.textContent = statusText();
    choice.hidden = !configured;
    save.hidden = !configured;
    checkbox.disabled = !configured;
    checkbox.checked = configured && root.analyticsConsent === true;
  }

  function showBanner(show) {
    ui.layer.hidden = !show;
    document.body.classList.toggle("cookie-banner-open", show);
  }

  function focusableIn(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )).filter(function (el) {
      return !el.closest("[hidden]") && el.offsetParent !== null;
    });
  }

  function openDialog(opener) {
    lastFocus = opener || document.activeElement;
    syncDialog();
    ui.dialog.hidden = false;
    document.body.classList.add("cookie-dialog-open");

    var checkbox = ui.dialog.querySelector("[data-cookie-analytics]");
    var closeButton = ui.dialog.querySelector(".cookie-dialog-panel [data-cookie-close]");

    if (checkbox && !checkbox.disabled) {
      checkbox.focus();
    } else if (closeButton) {
      closeButton.focus();
    }
  }

  function closeDialog() {
    if (!ui || ui.dialog.hidden) {
      return;
    }

    ui.dialog.hidden = true;
    document.body.classList.remove("cookie-dialog-open");

    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function decide(granted) {
    if (!measurementId()) {
      return;
    }

    if (!writeConsent(granted)) {
      return;
    }

    applyConsent(granted);
    showBanner(false);
    closeDialog();
  }

  function onKeydown(event) {
    if (!ui || ui.dialog.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var panel = ui.dialog.querySelector(".cookie-dialog-panel");
    var focusable = focusableIn(panel);

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
  }

  function buildUi() {
    var layer = document.createElement("div");
    layer.className = "cookie-layer";
    layer.hidden = true;
    layer.innerHTML = [
      '<div class="cookie-banner" role="region" aria-label="Súhlas s cookies">',
      '<h2 class="cookie-title">Cookies na Rozprávkovej Akadémii</h2>',
      "<p>Používame nevyhnutné technológie na fungovanie stránky a s vaším súhlasom analytické cookies Google Analytics, ktoré nám pomáhajú anonymne vyhodnocovať návštevnosť a zisťovať, ktoré rozprávky návštevníci radi čítajú.</p>",
      '<p><a data-cookie-privacy href="#">Viac v ochrane súkromia</a></p>',
      '<div class="cookie-actions">',
      '<button type="button" class="btn btn-primary cookie-decision" data-cookie-accept>Prijať analytické cookies</button>',
      '<button type="button" class="btn btn-secondary cookie-decision" data-cookie-reject>Odmietnuť</button>',
      "</div>",
      '<p class="cookie-settings-row"><button type="button" class="cookie-text-button" data-cookie-open-settings>Nastavenia cookies</button></p>',
      "</div>"
    ].join("");

    var dialog = document.createElement("div");
    dialog.className = "cookie-dialog";
    dialog.hidden = true;
    dialog.innerHTML = [
      '<div class="cookie-dialog-backdrop" data-cookie-close></div>',
      '<div class="cookie-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title">',
      '<h2 id="cookie-dialog-title">Nastavenia cookies</h2>',
      '<p data-cookie-status></p>',
      '<div class="cookie-choice" data-cookie-choice>',
      '<input id="cookie-analytics" type="checkbox" data-cookie-analytics>',
      '<label for="cookie-analytics"><span>Analytické cookies</span><small>Google Analytics 4 meria návštevnosť až po súhlase. Reklamné cookies nepoužívame.</small></label>',
      "</div>",
      '<div class="cookie-actions">',
      '<button type="button" class="btn btn-primary cookie-decision" data-cookie-save>Uložiť voľbu</button>',
      '<button type="button" class="btn btn-secondary cookie-decision" data-cookie-close>Zavrieť</button>',
      "</div>",
      "</div>"
    ].join("");

    layer.querySelector("[data-cookie-privacy]").setAttribute("href", pagePrefix() + "ochrana-sukromia.html#cookies");
    document.body.appendChild(layer);
    document.body.appendChild(dialog);

    return {
      layer: layer,
      dialog: dialog
    };
  }

  function init() {
    if (ui) {
      return;
    }

    ui = buildUi();

    if (measurementId() && readConsent() === null) {
      showBanner(true);
    }

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-cookie-accept]")) {
        decide(true);
        return;
      }

      if (event.target.closest("[data-cookie-reject]")) {
        decide(false);
        return;
      }

      var settings = event.target.closest("[data-cookie-settings], [data-cookie-open-settings]");

      if (settings) {
        event.preventDefault();
        openDialog(settings);
        return;
      }

      if (event.target.closest("[data-cookie-save]")) {
        decide(ui.dialog.querySelector("[data-cookie-analytics]").checked);
        return;
      }

      if (event.target.closest("[data-cookie-close]")) {
        closeDialog();
      }
    });

    document.addEventListener("keydown", onKeydown);
    root.openCookieSettings = function () {
      openDialog(document.activeElement);
    };
  }

  root.onAnalyticsConsentChange = function (listener) {
    if (typeof listener !== "function") {
      return;
    }

    consentListeners.push(listener);
  };

  root.analyticsConfigured = !!measurementId();
  root.analyticsConsent = false;
  setDefaultConsent();

  var storedConsent = readConsent();

  if (storedConsent === true && measurementId()) {
    applyConsent(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
