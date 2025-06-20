from js import document as doc, localStorage, window  # type: ignore[import]
from pyscript import when  # type: ignore[import]

is_dark = False


def _apply_theme():
    """Aplica tema atual aos elementos DOM"""
    theme = "dark" if is_dark else "light"
    icon = "moon" if is_dark else "sunny"

    doc.documentElement.setAttribute("data-theme", theme)

    toggle_button = doc.getElementById("theme-toggle")
    if toggle_button:
        icon_element = toggle_button.querySelector("ion-icon")
        if icon_element:
            icon_element.setAttribute("name", icon)
        toggle_button.classList.remove("is-loading")

    localStorage.setItem("theme", theme)


@when("click", "#theme-toggle")
def toggle_theme(event):
    global is_dark
    is_dark = not is_dark
    _apply_theme()


def init_theme():
    global is_dark
    saved = localStorage.getItem("theme")

    if saved:
        is_dark = saved == "dark"
    else:
        is_dark = window.matchMedia("(prefers-color-scheme: dark)").matches

    _apply_theme()


init_theme()
