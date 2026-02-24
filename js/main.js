const menuButton = document.querySelector(".menu-button");
const sideNav = document.getElementById("sideNav");
const arrow = document.querySelector(".arrow");
const mainContent = document.getElementById("mainContent");

menuButton.addEventListener("click", () => {
  sideNav.classList.toggle("active");
  arrow.classList.toggle("flipped");
  mainContent.classList.toggle("shifted");
});