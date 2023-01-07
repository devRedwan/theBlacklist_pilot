// Sticky NavBar
const navBar = document.querySelector(".navbar");
window.addEventListener("scroll", function () {
  if (window.scrollY > 250) {
    navBar.classList.add("sticky-top");
  } else {
    navBar.classList.remove("sticky-top");
  }
});
