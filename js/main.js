const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Theme toggle ----------
// the initial class is set by the inline script in <head>; this only
// handles clicks. it never READS localStorage - two readers would drift.
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
  root.classList.toggle("dark", dark);
  themeToggle.setAttribute("aria-pressed", dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
}

themeToggle.setAttribute("aria-pressed", root.classList.contains("dark"));
themeToggle.addEventListener("click", () => setTheme(!root.classList.contains("dark")));


// ---------- Subtitle typewriter ----------
const heroSub  = document.querySelector(".hero-sub");
const subText  = heroSub.querySelector(".sub-text");
const subs     = heroSub.dataset.subs.split("|");
const ERASE_MS = 28;
const TYPE_MS  = 55;
const HOLD_MS  = 2600;
let subIndex   = 0;

function erase(next) {
  const from = subText.textContent;
  let i = from.length;
  const step = setInterval(() => {
    i--;
    subText.textContent = from.slice(0, i);
    if (i <= 0) { clearInterval(step); type(next); }
  }, ERASE_MS);
}

function type(next) {
  const to = subs[next];
  let i = 0;
  const step = setInterval(() => {
    i++;
    subText.textContent = to.slice(0, i);
    if (i >= to.length) { clearInterval(step); setTimeout(cycle, HOLD_MS); }
  }, TYPE_MS);
}

function cycle() {
  if (document.hidden) { setTimeout(cycle, HOLD_MS); return; }
  subIndex = (subIndex + 1) % subs.length;
  erase(subIndex);
}

if (!reduceMotion) setTimeout(cycle, HOLD_MS);


// ---------- Active nav link ----------
const navLinks = document.querySelectorAll(".header-middle a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove("is-active"));
      const activeLink = document.querySelector(
        `.header-middle a[data-section="${entry.target.id}"]`
      );
      if (activeLink) activeLink.classList.add("is-active");
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" });
document.querySelectorAll(".section[id]").forEach(s => sectionObserver.observe(s));

document.querySelector('.header-middle a[data-section="hero"]')
  .addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0 });
    history.replaceState(null, "", location.pathname);
  });


// ---------- Card thumbnails: play video on hover ----------
if (!reduceMotion) {
  document.querySelectorAll(".card-thumb video").forEach(video => {
    const card = video.closest(".card");
    card.addEventListener("mouseenter", () => video.play().catch(() => {}));
    card.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}


// a silent video failure looks identical to a working poster, so say so
document.querySelectorAll("video").forEach(v => {
  v.addEventListener("error", () => console.warn(
    "Video failed:", v.currentSrc || v.src,
    "- MediaError code", v.error && v.error.code,
    "(4 = missing file or unsupported codec)"
  ));
});


// ---------- Project dialogs ----------
// <dialog>.showModal() gives us the focus trap, Escape-to-close, background
// inert-ing and focus restore for free. We only add: click-outside, scroll
// lock, and URL sync.
let suppressHistory = false;

function openProject(id, push = true) {
  const dlg = document.getElementById("pj-" + id);
  if (!dlg || dlg.open) return;
  dlg.showModal();
  root.classList.add("modal-open");
  initCarousels(dlg); // must run AFTER open - widths are 0 while display:none
  // same JS-driven play as the card hover preview, which is the path we know works
  if (!reduceMotion) dlg.querySelectorAll("video").forEach(v => v.play().catch(() => {}));
  // same behaviour as the card previews: muted, looping, no controls.
  // driven from JS because the autoplay attribute is unreliable on an
  // element that was display:none until this instant.
  if (!reduceMotion) dlg.querySelectorAll("video").forEach(v => v.play().catch(() => {}));
  if (push) history.pushState({ project: id }, "", "#p-" + id);
}

document.querySelectorAll(".card-open").forEach(btn => {
  btn.addEventListener("click", () => openProject(btn.dataset.project));
});

document.querySelectorAll(".pj").forEach(dlg => {
  // a click whose target IS the dialog element landed on the backdrop,
  // because .pj-header and .pj-body cover everything inside
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  // close button, Escape and backdrop all funnel through this one event
  dlg.addEventListener("close", () => {
    root.classList.remove("modal-open");
    dlg.querySelectorAll("video").forEach(v => v.pause());
    if (!suppressHistory && history.state && history.state.project) history.back();
    suppressHistory = false;
  });
});

// back button closes the dialog instead of leaving the page
window.addEventListener("popstate", () => {
  const open = document.querySelector(".pj[open]");
  if (open) { suppressHistory = true; open.close(); return; }
  if (location.hash.startsWith("#p-")) openProject(location.hash.slice(3), false);
});

// deep link: krishlenka.github.io/#p-learntrack opens straight to that project
if (location.hash.startsWith("#p-")) openProject(location.hash.slice(3), false);


// ---------- Carousel ----------
function initCarousels(scope) {
  scope.querySelectorAll(".pj-carousel").forEach(car => {
    const track  = car.querySelector(".pj-track");
    const slides = track.children.length;
    const prev   = car.querySelector(".pj-arrow--prev");
    const next   = car.querySelector(".pj-arrow--next");
    const count  = car.parentElement.querySelector(".pj-count"); // sibling, not a child

    // one slide means no arrows at all, and nothing else to wire up
    if (slides < 2) {
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      if (count) count.hidden = true;
      return;
    }

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.hidden = track.scrollLeft <= 1;          // hidden at the start
      next.hidden = track.scrollLeft >= max - 1;    // hidden at the end
      if (count) {
        const i = Math.round(track.scrollLeft / track.clientWidth) + 1;
        count.textContent = `${i} / ${slides}`;
      }
    };

    if (car.dataset.ready) { update(); return; } // reopened - just refresh arrows
    car.dataset.ready = "1";

    track.addEventListener("scroll", update, { passive: true });
    prev.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth, behavior: "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left:  track.clientWidth, behavior: "smooth" }));

    // click-and-drag for mice. touch already scrolls natively, and hijacking
    // it would break the momentum and snapping the browser does better.
    // NOTE the 6px threshold: below it we never capture the pointer, so a plain
    // click still reaches the video controls underneath.
    let pending = false, dragging = false, startX = 0, startScroll = 0;

    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      pending = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    });

    track.addEventListener("pointermove", (e) => {
      if (!pending) return;
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < 6) return;   // still a click, not a drag
        dragging = true;
        track.setPointerCapture(e.pointerId);
        track.classList.add("is-dragging");
      }
      track.scrollLeft = startScroll - dx;
    });

    const endDrag = () => {
      pending = false;
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      // re-snap to the nearest slide now that snapping is back on
      track.scrollTo({ left: Math.round(track.scrollLeft / track.clientWidth) * track.clientWidth, behavior: "smooth" });
    };

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    update();
  });
}

/** NOTES
 *
 * document = browser's representation of the HTML page
 *
 * .querySelector()    = find the FIRST element matching a CSS selector
 * .querySelectorAll() = find ALL matching elements, returns a NodeList
 *                       (NodeList has .forEach but NOT .addEventListener)
 * .getElementById()   = find by id="" attribute on the tag
 *
 * .addEventListener("click", ...) = watch this element for a click, then run the following code
 * () => { ... } is an arrow function, a shorter way to write function() { ... }
 *
 * .classList.toggle("active") = add the "active" class if absent, remove it if present
 *
 * element.dataset.subs = reads the data-subs="" attribute off the tag
 *
 * setInterval(fn, ms)  = run fn repeatedly every ms until clearInterval() stops it
 * setTimeout(fn, ms)   = run fn once, after ms milliseconds
 *
 * IntersectionObserver = a browser API that watches when elements enter or leave the viewport
 *
 * matchMedia("(prefers-reduced-motion: reduce)") = reads the OS "reduce motion"
 *   accessibility setting, so animations can be skipped for users who asked for that
 *
 */