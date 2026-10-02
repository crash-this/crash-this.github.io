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

  var panicText = [
    "[   13.370412] BUG: kernel NULL pointer dereference, address: 0000000000000000",
    "[   13.370415] #PF: supervisor instruction fetch in kernel mode",
    "[   13.370418] Oops: 0010 [#1] PREEMPT SMP",
    "[   13.370421] CPU: 0 PID: 1 Comm: search Not tainted 6.18.0-crash #1",
    "[   13.370424] Hardware name: CRASH, Graz, 30 November 2026",
    "[   13.370427] RIP: 0010:checks+0x0/0x0",
    "[   13.370430] Call Trace:",
    "[   13.370431]  <TASK>",
    "[   13.370433]  vibes+0x7f/0x80",
    "[   13.370436]  relevance+0x11/0x20",
    "[   13.370439]  similarity+0x2a/0x40",
    "[   13.370442]  </TASK>",
    "[   13.370445] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009",
    "[   13.370448] ---[ end Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009 ]---"
  ].join("\n");

  function still() { return calm || fx !== "on"; }

  function crash() {
    if (document.getElementById("panic")) return;
    var falling = !still();
    if (falling) {
      document.querySelectorAll(".side > *, .hero, main > section, footer.site").forEach(function (el) {
        el.classList.add("fall");
        el.style.setProperty("--dx", (Math.random() * 40 - 20) + "vw");
        el.style.setProperty("--rot", (Math.random() * 50 - 25) + "deg");
        el.style.setProperty("--delay", (Math.random() * 0.3).toFixed(2) + "s");
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("crashed"); }); });
    }
    setTimeout(showPanic, falling ? 900 : 0);
  }

  function showPanic() {
    var box = document.createElement("div");
    box.id = "panic";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-label", "The page crashed");
    var pre = document.createElement("pre");
    pre.className = "err";
    panicText.split("\n").forEach(function (text) {
      var line = document.createElement("span");
      line.className = "line";
      line.textContent = text;
      pre.appendChild(line);
    });
    box.appendChild(pre);
    var tail = document.createElement("div");
    tail.className = "line";
    tail.innerHTML = '<p><button type="button">Press Enter to reboot</button></p>';
    box.appendChild(tail);
    document.body.appendChild(box);
    root.classList.add("crashed");
    var lines = box.querySelectorAll(".line");
    var step = still() ? 0 : 70;
    requestAnimationFrame(function () { box.classList.add("on"); });
    lines.forEach(function (line, n) {
      setTimeout(function () { line.classList.add("on"); }, 250 + n * step);
    });
    var button = box.querySelector("button");
    button.addEventListener("click", reboot);
    setTimeout(function () { button.focus(); }, 250 + lines.length * step);
  }

  function reboot() {
    var box = document.getElementById("panic");
    scrollTo(0, 0);
    root.classList.remove("crashed");
    if (box) {
      box.classList.remove("on");
      setTimeout(function () { box.remove(); }, still() ? 0 : 500);
    }
    setTimeout(function () {
      document.querySelectorAll(".fall").forEach(function (el) {
        el.classList.remove("fall");
        ["--dx", "--rot", "--delay"].forEach(function (v) { el.style.removeProperty(v); });
      });
    }, still() ? 0 : 750);
    var out = document.querySelector(".prompt-out");
    if (out) out.textContent = "rebooted. welcome back.";
    var cmd = document.getElementById("cmd");
    if (cmd) cmd.focus({ preventScroll: true });
  }

  function go(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var box = el.closest("details");
    if (box) box.open = true;
    history.replaceState(null, "", "#" + id);
    el.scrollIntoView({ behavior: still() ? "auto" : "smooth" });
  }

  function run(line) {
    switch (line.trim().toLowerCase()) {
      case "": case "clear": return "";
      case "help": return "commands: help, clear, manifesto, register, crash";
      case "manifesto": case "manifest": go("manifesto"); return "";
      case "register": go("register"); return "see you on 30 november.";
      case "crash": crash(); return "";
      default: return line.trim() + ": command not found. try help";
    }
  }

  document.addEventListener("submit", function (e) {
    if (!e.target.classList.contains("prompt")) return;
    e.preventDefault();
    var input = e.target.querySelector("input");
    document.querySelector(".prompt-out").textContent = run(input.value);
    input.value = "";
  });

  addEventListener("hashchange", reveal);
  document.addEventListener("DOMContentLoaded", function () { apply(); marks(); reveal(); spy(); });
})();
