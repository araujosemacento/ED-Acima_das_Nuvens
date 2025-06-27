from browser import window, document as dom

if window.localStorage.getItem("theme") is None:
    window.localStorage.setItem(
        "theme",
        (
            "dark"
            if window.matchMedia("(prefers-color-scheme: dark)").matches == True
            else "light"
        ),
    )
    dom.documentElement.setAttribute("data-theme", window.localStorage.getItem("theme"))


""" def theme_toggle(event):
    current_theme = dom.documentElement.getAttribute("data-theme")
    new_theme = "dark" if current_theme == "light" else "light"
    dom.documentElement.setAttribute("data-theme", new_theme)
    window.localStorage.setItem("theme", new_theme) """


dom.getElementById("sampleButton").addEventListener("click", lambda e: theme_toggle(e))
