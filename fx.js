// Effects switch, next date in the dates table, current section in the sidebar,
// and opening a folded block when a link points into it.
// Without this file the effects stay off and the page reads the same.
(function () {
  var root = document.documentElement;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var query = new URLSearchParams(location.search);
  var fx = query.get("fx") || get("crash-fx") || (calm ? "off" : "on");
  root.dataset.fx = fx;

  var grades = ["g0", "g20", "g35", "g50", "g70", "g100"];
  var timer = null;
  function flicker() {
    var letters = document.querySelectorAll(".wordmark span");
    if (!letters.length) return;
    var el = letters[Math.floor(Math.random() * letters.length)];
    var home = el.dataset.grade;
    el.className = grades[Math.floor(Math.random() * grades.length)];
    setTimeout(function () { el.className = home; }, 140);
  }
  function apply() {
    root.dataset.fx = fx;
    clearInterval(timer);
    if (fx === "on") timer = setInterval(flicker, 2600);
    document.querySelectorAll("[data-set-fx]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.setFx === fx));
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.setFx) { fx = b.dataset.setFx; set("crash-fx", fx); }
    apply();
  });
  function marks() {
    var today = new Date().toISOString().slice(0, 10);
    var next = null;
    document.querySelectorAll("tr[data-date]").forEach(function (tr) {
      if (tr.dataset.date < today) tr.classList.add("past");
      else if (!next) { next = tr; tr.classList.add("next"); }
    });

  }

  function reveal() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    var box = el && el.closest("details");
    if (box && !box.open) { box.open = true; el.scrollIntoView(); }
  }

  function spy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.side nav a[href^="#"]'));
    var parts = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
    var held = null, release = null, waiting = false;

    function mark(link) {
      links.forEach(function (a) {
        if (a === link) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    }
    function find() {
      var line = innerHeight * 0.3, hit = null;
      var bottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      parts.forEach(function (el, i) {
        if (!el) return;
        var top = el.getBoundingClientRect().top;
        if (top <= line || (bottom && top < innerHeight)) hit = links[i];
      });
      return hit;
    }
    function update() { waiting = false; mark(held || find()); }
    function let_go() { held = null; clearTimeout(release); update(); }

    addEventListener("scroll", function () {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    }, { passive: true });
    addEventListener("resize", update);
    addEventListener("scrollend", let_go);
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        held = a; mark(a);
        clearTimeout(release);
        release = setTimeout(let_go, 1200);
      });
    });
    update();
  }

  addEventListener("hashchange", reveal);
  document.addEventListener("DOMContentLoaded", function () { apply(); marks(); reveal(); spy(); });
})();
