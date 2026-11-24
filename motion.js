/* JSK Creation — motion layer (scroll reveals + small touches).
   Pure progressive enhancement: if JavaScript, IntersectionObserver or
   reduced-motion is unavailable, the page simply shows everything as normal. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  // things that rise into view as you scroll
  var TARGETS = [
    ".section-head",
    ".card[data-pid]",
    ".trend-tile",
    ".trust-item",
    ".footer-grid > *",
    ".checkout-card",
    ".categories-card"
  ].join(",");
  // never animate things inside menus, the cart drawer or pop-up dialogs
  var SKIP = 'nav, header, [class*="drawer"], [class*="modal"], [class*="mega"], .toast-stack';

  var seen = new WeakSet();

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      el.classList.remove("mo-pending");
      el.classList.add("mo-play");
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  // siblings that appear together rise one after another
  function delayFor(el) {
    var idx = 0;
    for (var s = el.previousElementSibling; s; s = s.previousElementSibling) idx++;
    return Math.min(idx, 6) * 80;
  }

  function markAll(root) {
    root.querySelectorAll(TARGETS).forEach(function (el) {
      if (seen.has(el) || el.closest(SKIP)) return;
      seen.add(el);
      el.classList.add("mo-pending");
      el.style.setProperty("--mo-d", delayFor(el) + "ms");
      io.observe(el);
    });
  }

  // re-run when the catalogue or other sections are (re)drawn
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      markAll(document);
    });
  }

  function start() {
    document.documentElement.classList.add("mo-js");
    markAll(document);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });

    // bounce the cart badge whenever its number changes
    var badge = document.getElementById("cartCount");
    if (badge && window.MutationObserver) {
      new MutationObserver(function () {
        badge.classList.remove("mo-pop");
        void badge.offsetWidth; // restart the animation
        badge.classList.add("mo-pop");
      }).observe(badge, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
