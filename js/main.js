const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
  root.classList.toggle("dark", dark);
  themeToggle.setAttribute("aria-pressed", dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
}

themeToggle.setAttribute("aria-pressed", root.classList.contains("dark"));
themeToggle.addEventListener("click", () => setTheme(!root.classList.contains("dark")));

// ---------- Subtitle typewriter ----------
// erases the current title character by character, then types the next one
const heroSub  = document.querySelector(".hero-sub");
const subText  = heroSub.querySelector(".sub-text");
const subs     = heroSub.dataset.subs.split("|");
const ERASE_MS = 28;    // per-character delete speed (faster than typing)
const TYPE_MS  = 55;    // per-character type speed
const HOLD_MS  = 2600;  // pause on a finished title
let subIndex   = 0;

function erase(next) {
  const from = subText.textContent;
  let i = from.length;
  const step = setInterval(() => {
    i--;
    subText.textContent = from.slice(0, i);
    if (i <= 0) {
      clearInterval(step);
      type(next);
    }
  }, ERASE_MS);
}

function type(next) {
  const to = subs[next];
  let i = 0;
  const step = setInterval(() => {
    i++;
    subText.textContent = to.slice(0, i);
    if (i >= to.length) {
      clearInterval(step);
      setTimeout(cycle, HOLD_MS);
    }
  }, TYPE_MS);
}

function cycle() {
  if (document.hidden) { setTimeout(cycle, HOLD_MS); return; } // don't animate in a background tab
  subIndex = (subIndex + 1) % subs.length;
  erase(subIndex);
}

if (!reduceMotion) setTimeout(cycle, HOLD_MS);


// ---------- Active nav link, based on viewport midpoint ----------
const navLinks = document.querySelectorAll(".header-middle a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove("is-active"));
      const activeLink = document.querySelector(
        `.header-middle a[data-section="${entry.target.id}"]`
      );
      if (activeLink) activeLink.classList.add("is-active"); // guard in case no link matches
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" }); // shrinks the detection zone to a line at the viewport's midpoint
document.querySelectorAll(".section[id]").forEach(s => sectionObserver.observe(s));

// "About Me" points at the site root; scroll instead of reloading
document.querySelector('.header-middle a[data-section="hero"]')
  .addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0 }); // no behavior key, so CSS scroll-behavior decides
    history.replaceState(null, "", location.pathname); // clear a leftover #hash
  });


// ---------- Card thumbnails: play video on hover, reset on leave ----------
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