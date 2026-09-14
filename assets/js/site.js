// Theme toggle. The saved choice is applied pre-paint in head.html; this only
// handles the button and keeps the icon in sync with the effective theme.
(function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  var sun = btn.querySelector(".icon-sun");
  var moon = btn.querySelector(".icon-moon");
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function effective() {
    var set = document.documentElement.getAttribute("data-theme");
    return set || (media.matches ? "dark" : "light");
  }

  function paint() {
    var dark = effective() === "dark";
    // Show the icon for the theme the button will switch *to*.
    sun.hidden = !dark;
    moon.hidden = dark;
  }

  btn.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    paint();
  });

  media.addEventListener("change", paint);
  paint();
})();
