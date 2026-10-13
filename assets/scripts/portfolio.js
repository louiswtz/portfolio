// Portfolio — behaviour of the web version: theme, navigation, entrance, Myst demo.

(function () {
  "use strict";

  var root = document.documentElement;
  var still = /[?&]static\b/.test(location.search); // no entrance effect (used for testing)

  // ---------- Theme ----------
  var themeButton = document.querySelector("[data-action=theme]");

  function showTheme() {
    var dark = root.dataset.theme === "dark";
    if (themeButton) {
      themeButton.setAttribute("aria-label", dark ? "Passer au thème clair" : "Passer au thème sombre");
      themeButton.textContent = dark ? "Clair" : "Sombre";
    }
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", root.dataset.theme);
      } catch (e) {
        // The choice just won't be remembered.
      }
      showTheme();
    });
  }
  showTheme();

  // ---------- Menu (small screens) ----------
  var menuButton = document.querySelector("[data-action=menu]");
  var nav = document.querySelector(".toc");

  function setMenu(open) {
    root.classList.toggle("nav-open", open);
    if (menuButton) menuButton.setAttribute("aria-expanded", String(open));
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(!root.classList.contains("nav-open"));
    });
  }
  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  // ---------- Where the reader is ----------
  var where = document.querySelector(".topbar .where");
  var bar = document.querySelector(".progress");
  var items = Array.prototype.slice.call(document.querySelectorAll(".toc li"));
  var entries = items
    .map(function (li) {
      var link = li.querySelector("a");
      var target = link && document.getElementById(link.getAttribute("href").slice(1));
      return target ? { li: li, target: target, top: li.classList.contains("l1") } : null;
    })
    .filter(Boolean);

  // Each sub-entry belongs to the section entry above it.
  var parent = null;
  entries.forEach(function (entry) {
    if (entry.top) parent = entry;
    else entry.parent = parent;
  });

  function update() {
    var line = window.innerHeight * 0.3;
    var section = null;
    var sub = null;
    entries.forEach(function (entry) {
      if (entry.target.getBoundingClientRect().top <= line) {
        if (entry.top) {
          section = entry;
          sub = null;
        } else {
          sub = entry;
        }
      }
    });
    entries.forEach(function (entry) {
      entry.li.classList.toggle("active", entry === section || entry === sub);
      if (!entry.top) entry.li.classList.toggle("open", entry.parent === section);
    });
    if (where) {
      var title = section ? section.li.querySelector(".t").firstChild.textContent.trim() : "";
      where.textContent = title;
    }
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
    }
  }

  var waiting = false;
  function schedule() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(function () {
      waiting = false;
      update();
    });
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();

  // ---------- Contact: independent of the visitor's mail application ----------
  var emailField = document.getElementById("contact-email");
  var copyButton = document.querySelector("[data-action=copy-email]");
  var contactStatus = document.getElementById("contact-status");
  var contactTitle = document.getElementById("contact-title");
  document.querySelectorAll('a[href="#contact"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (contactTitle) contactTitle.focus({ preventScroll: true });
    });
  });

  if (emailField && copyButton && contactStatus) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async function () {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(emailField.value);
        contactStatus.textContent = "Adresse copiée. Collez-la dans votre messagerie.";
      } catch (error) {
        // Permission denied, an older browser, or a local file: retain manual copying.
        emailField.focus();
        emailField.select();
        contactStatus.textContent = "Copie automatique indisponible. L’adresse est sélectionnée : utilisez Ctrl+C ou Cmd+C, ou le menu Copier sur mobile.";
      }
    });
  }

  // ---------- Entrance ----------
  var blocks = document.querySelectorAll("main > *");
  if (!still && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(
      function (list) {
        list.forEach(function (item) {
          if (item.isIntersecting) {
            item.target.classList.add("in");
            seen.unobserve(item.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    blocks.forEach(function (block) {
      block.classList.add("reveal");
      seen.observe(block);
    });
  }

  // ---------- Myst demo ----------
  document.querySelectorAll(".sprite-demo").forEach(function (demo) {
    var stage = demo.querySelector(".stage");
    demo.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-set]");
      if (!button) return;
      var key = button.dataset.set;
      stage.dataset[key] = button.value;
      demo.querySelectorAll('button[data-set="' + key + '"]').forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === button));
      });
    });
  });
})();
