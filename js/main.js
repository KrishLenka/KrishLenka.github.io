const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// ---------- Theme toggle ----------
// the initial class is set by the inline script in <head>, before first paint.
// this only handles clicks - it never READS localStorage, or the two would drift
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


// ---------- Carousels ----------
function updateCarousel(carousel) {
  const track = carousel.querySelector(".pj-track");
  const width = track.clientWidth;
  if (!width) return; // still hidden inside a closed dialog

  const max = track.scrollWidth - width;
  carousel.querySelector(".pj-arrow--prev").hidden = track.scrollLeft <= 1;
  carousel.querySelector(".pj-arrow--next").hidden = track.scrollLeft >= max - 1;
  carousel.querySelector(".pj-count").textContent =
    `${Math.round(track.scrollLeft / width) + 1} / ${track.children.length}`;
}

document.querySelectorAll(".pj-carousel").forEach(carousel => {
  const track = carousel.querySelector(".pj-track");
  if (track.children.length < 2) {
    carousel.classList.add("is-single"); // no arrows, no counter
    return;
  }

  const step = () => track.clientWidth;
  carousel.querySelector(".pj-arrow--prev")
    .addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  carousel.querySelector(".pj-arrow--next")
    .addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", () => updateCarousel(carousel), { passive: true });

  // click-and-drag for mice. touch is skipped on purpose - the browser's own
  // scrolling is smoother than anything reproduced here
  let startX = 0, startScroll = 0, dragging = false;

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    dragging = true;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    track.scrollLeft = startScroll - (e.clientX - startX);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    const w = track.clientWidth;
    track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior: "smooth" });
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
});


// ---------- Project dialogs ----------
function openDialog(dialog) {
  dialog.showModal();
  root.classList.add("modal-open");
  dialog.querySelectorAll("video").forEach(v => v.play().catch(() => {}));
  dialog.querySelectorAll(".pj-carousel").forEach(updateCarousel);
  if (history.state?.project !== dialog.id) {
    history.pushState({ project: dialog.id }, "", "#" + dialog.id);
  }
}

document.querySelectorAll(".card-open[data-project]").forEach(button => {
  const dialog = document.getElementById(button.dataset.project);
  if (!dialog) return;

  button.addEventListener("click", () => openDialog(dialog));

  // a click whose target IS the dialog element came from the backdrop
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector(".pj-close").addEventListener("click", () => dialog.close());

  // fires for the X, the backdrop AND the Esc key, so cleanup lives here once
  dialog.addEventListener("close", () => {
    root.classList.remove("modal-open");
    dialog.querySelectorAll("video").forEach(v => { v.pause(); v.currentTime = 0; });
    if (history.state?.project === dialog.id) history.back();
  });
});

// back button closes an open dialog instead of leaving the page
window.addEventListener("popstate", () => {
  const open = document.querySelector("dialog[open]");
  if (open) open.close();
});

// someone arrived on a shared #project-xyz link
if (location.hash.startsWith("#project-")) {
  const dialog = document.getElementById(location.hash.slice(1));
  if (dialog?.tagName === "DIALOG") openDialog(dialog);
}


// ---------- Copy to clipboard + toast ----------
const TOAST_MS = 3000;
const toast = document.getElementById("toast");
let toastTimer;

// keeps the CSS countdown bar and the JS timer on one number
toast.style.setProperty("--toast-ms", TOAST_MS + "ms");

function showToast(message) {
  toast.querySelector(".toast-text").textContent = message;
  toast.classList.remove("is-visible");
  void toast.offsetWidth; // forces a reflow so the bar animation restarts
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), TOAST_MS);
}

document.querySelectorAll("[data-copy-user]").forEach(el => {
  el.addEventListener("click", async () => {
    const address = `${el.dataset.copyUser}@${el.dataset.copyDomain}`;
    try {
      await navigator.clipboard.writeText(address);
      showToast("Copied to clipboard");
    } catch (e) {
      // clipboard is blocked (insecure context, or the user denied it):
      // fall back to opening their mail app rather than failing silently
      window.location.href = "mailto:" + address;
    }
  });
});



/** NOTES
 *
 * <dialog>.showModal() = opens in the browser's "top layer". gives focus
 *   trapping, Esc-to-close and an inert background with no extra code.
 *   dialog.close() fires a "close" event no matter how it was closed.
 *
 * ::backdrop = the dimmed area behind an open modal dialog
 *
 * <details>/<summary> = native collapsible section, no JS needed
 *
 * scroll-snap-type: x mandatory = native swipe-between-slides on touch
 *
 * setPointerCapture = keeps sending pointer events to this element even if
 *   the cursor leaves it, so a drag doesn't break when you overshoot
 *
 * history.pushState = changes the URL without loading a page.
 *   "popstate" fires when the user hits back
 *
 * element.dataset.project = reads the data-project="" attribute off the tag
 *
 * .querySelector()    = find the FIRST element matching a CSS selector
 * .querySelectorAll() = find ALL matching elements, returns a NodeList
 *                       (NodeList has .forEach but NOT .addEventListener)
 *
 * IntersectionObserver = a browser API that watches when elements enter or
 *   leave the viewport
 *
 * matchMedia("(prefers-reduced-motion: reduce)") = reads the OS "reduce
 *   motion" accessibility setting
 *
 * navigator.clipboard.writeText = copies text. only works on https or
 *   localhost, so it will fail if you open index.html straight from disk
 *
 * void el.offsetWidth = reads a layout property purely to force the browser
 *   to flush pending style changes, so removing then re-adding a class
 *   restarts its animation instead of being collapsed into a no-op
 */