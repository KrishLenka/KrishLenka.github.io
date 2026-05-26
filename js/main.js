const menuButton = document.querySelector(".menu-button");
const sideNav = document.getElementById("sideNav");
const mainContent = document.getElementById("mainContent");

// sidebar toggle
menuButton.addEventListener("click", () => {
  const isOpen = sideNav.classList.toggle("active");
  menuButton.classList.toggle("is-active", isOpen);
  mainContent.classList.toggle("shifted", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
});

// Dark mode toggle
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Subtitle carousel
const subs = Array.from(document.querySelectorAll(".sub"));
let subIndex = 0;
subs[0].classList.add("is-visible");
function rotateSub() {
  const leaving  = subs[subIndex];
  subIndex       = (subIndex + 1) % subs.length; // wraps around to 0 after 3
  const entering = subs[subIndex];
  leaving.classList.remove("is-visible");
  leaving.classList.add("is-leaving");
  setTimeout(() => leaving.classList.remove("is-leaving"), 500);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      entering.classList.add("is-visible");
    });
  });
}
setInterval(rotateSub, 5000);

// Automatically update active nav link based on viewport midpoint
const navLinks = document.querySelectorAll(".header-nav a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove("is-active"));
      const activeLink = document.querySelector(
        `.header-nav a[href="#${entry.target.id}"]` // dynamically find the nav link that corresponds to the section in view
      );
      if (activeLink) activeLink.classList.add("is-active"); // guard to prevent crash in case no matching link is found
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" }); // Shrinks the detection zone to a horizontal line at the viewport's midpoint
document.querySelectorAll(".section[id]").forEach(s => sectionObserver.observe(s));


/** NOTES
 * 
 * document = browser's representation of the HTML page
 * 
 * .querySelector() = find by CSS selector
 * .getElementById() = find by id="" attribute on the tag
 * 
 * .addEventListener("click", ...) = watch this element for a click, the run the following code...
 * () = > { ... } is an arrow function, a shorter way to write functino() { ... }
 * 
 * .classList.toggle("active") = add the "active" class if it's not there, remove it if it is there
 * 
 * querySelectorAll() = find all elements matching a CSS selector, returns a list of elements
 * Array.from(...) = convert the list into an array
 * 
 * setTimeout(() => ..., 500) = run the following code after 500 milliseconds
 * 
 * requestAnimationFrame(() = > ...) = run the following code on the next screen repaint, used here to ensure the "is-leaving" class is applied before we add "is-visible" to the next subtitle
 * 
 * IntersectionObserver = a browser API that watches when elements enter or leave the viewport
 * 
 */