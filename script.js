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
