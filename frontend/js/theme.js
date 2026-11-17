const themeToggle = document.getElementById("theme-toggle");

// Load saved preference.
const savedTheme = localStorage.getItem("theme");
const initialTheme = savedTheme === "light" ? "light" : "dark";

document.documentElement.dataset.theme = initialTheme;

// Update the switch's accessibility label and tooltip.
function updateThemeButton() {
    if (!themeToggle) return;
    const isLight = document.documentElement.dataset.theme === "light";
    const label = isLight
        ? "Switch to dark mode"
        : "Switch to light mode";

    const icon = themeToggle.querySelector(".theme-switch-icon");

    if (icon) {
        icon.textContent = isLight ? "☀" : "☾";
    }

    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-checked", String(isLight));
}

// Switch themes when clicked.
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.dataset.theme;

        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.dataset.theme = newTheme;

        localStorage.setItem("theme", newTheme);

        updateThemeButton();
    });
}

updateThemeButton();