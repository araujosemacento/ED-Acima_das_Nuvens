from browser import document, window  # type: ignore[import]

theme_button = document.getElementById("theme-toggle")
theme_icon = document.getElementById("theme-icon")
theme_container = document.getElementById("theme-container")

theme_button.classList.toggle("is-loading")

html_element = document.querySelector("html")
body_element = document.querySelector("body")


def is_system_dark():
    return window.matchMedia("(prefers-color-scheme: dark)").matches


def is_dark_theme():
    return [
        html_element.getAttribute("data-theme"),
        body_element.getAttribute("data-theme"),
    ]


def is_dark_class():
    return [
        html_element.classList.contains("dark-theme"),
        body_element.classList.contains("dark-theme"),
    ]


def set_theme_mode(mode):
    """Define o modo de tema: 'light', 'dark' ou 'system'"""
    # Remove todas as classes e data-themes
    for element in [html_element, body_element]:
        element.classList.remove("light-theme", "dark-theme")
        element.removeAttribute("data-theme")

    if mode == "light":
        # Aplica tema claro (classes têm prioridade)
        for element in [html_element, body_element]:
            element.setAttribute("data-theme", "light")
            element.classList.add("light-theme")
    elif mode == "dark":
        # Aplica tema escuro (classes têm prioridade)
        for element in [html_element, body_element]:
            element.setAttribute("data-theme", "dark")
            element.classList.add("dark-theme")
    # mode == "system": mantém limpo para usar prefers-color-scheme

    set_icon_name()


def set_icon_name():
    """Define ícone baseado na prioridade: class > data-theme > prefers-color-scheme"""
    dark_classes = is_dark_class()
    light_classes = [
        html_element.classList.contains("light-theme"),
        body_element.classList.contains("light-theme"),
    ]

    # 1. Classes têm máxima prioridade
    if any(dark_classes) or any(light_classes):
        is_dark_active = any(dark_classes)
    else:
        # 2. data-theme como fallback
        data_themes = is_dark_theme()
        if any(theme == "dark" for theme in data_themes if theme):
            is_dark_active = True
        elif any(theme == "light" for theme in data_themes if theme):
            is_dark_active = False
        else:
            # 3. prefers-color-scheme como último recurso
            is_dark_active = is_system_dark()

    theme_icon.name = "moon" if is_dark_active else "sunny"


# Event listeners para botões do popup
document.getElementById("theme-light").addEventListener(
    "click", lambda _: set_theme_mode("light")
)
document.getElementById("theme-dark").addEventListener(
    "click", lambda _: set_theme_mode("dark")
)
document.getElementById("theme-system").addEventListener(
    "click", lambda _: set_theme_mode("system")
)

set_icon_name()
