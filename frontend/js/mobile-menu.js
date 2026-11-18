document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".navbar-menu-toggle");
    const navLinks = document.querySelector(".navbar-links");

    if (!menuButton || !navLinks) return;

    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("menu-open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });
});