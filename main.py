from js import document, localStorage, window  # type: ignore


def load_theme(event):
    saved_theme = localStorage.getItem("theme")
    if saved_theme:
        document.body.setAttribute("data-theme", saved_theme)
    else:
        prefers_dark = window.matchMedia("(prefers-color-scheme: dark)").matches
        theme = "dark" if prefers_dark else "light"
        document.body.setAttribute("data-theme", theme)


def process_input(event):
    input_text = document.querySelector("#teste")
    output_div = document.querySelector("#output")
    output_div.innerText = input_text.value


def main():
    document.addEventListener("DOMContentLoaded", load_theme)


if __name__ == "__main__":
    main()
