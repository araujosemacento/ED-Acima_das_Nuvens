from js import document, localStorage, window  # type: ignore


def get_system_theme():
    """Detecta o tema preferido do sistema"""
    prefers_dark = window.matchMedia("(prefers-color-scheme: dark)").matches
    return "dark" if prefers_dark else "light"


def get_current_theme():
    """Obtém o tema atual ou padrão"""
    saved_theme = localStorage.getItem("theme")
    if saved_theme and saved_theme in ["light", "dark", "system"]:
        return saved_theme
    return "system"


def apply_theme(theme_name):
    """Aplica o tema especificado"""
    if theme_name == "system":
        actual_theme = get_system_theme()
    else:
        actual_theme = theme_name

    document.body.setAttribute("data-theme", actual_theme)
    return actual_theme


def update_theme_icon(theme_name, actual_theme=None):
    """Atualiza o ícone do botão de tema"""
    theme_icon = document.querySelector("#theme-icon")
    if not theme_icon:
        return

    if actual_theme is None:
        actual_theme = apply_theme(theme_name)

    icon_map = {"light": "sunny", "dark": "moon", "system": "desktop"}

    # Se for system, usa o ícone baseado no tema detectado
    if theme_name == "system":
        if actual_theme == "dark":
            theme_icon.setAttribute("name", "moon")
        else:
            theme_icon.setAttribute("name", "sunny")
    else:
        theme_icon.setAttribute("name", icon_map.get(theme_name, "sunny"))


def update_active_option(theme_name):
    """Atualiza o botão ativo no popup"""
    options = document.querySelectorAll(".theme-option")
    for option in options:
        option_theme = option.getAttribute("data-theme")
        if option_theme == theme_name:
            option.classList.add("is-active")
        else:
            option.classList.remove("is-active")


def set_theme(theme_name):
    """Define o tema e salva no localStorage"""
    localStorage.setItem("theme", theme_name)
    actual_theme = apply_theme(theme_name)
    update_theme_icon(theme_name, actual_theme)
    update_active_option(theme_name)


def handle_theme_change(event):
    """Manipula a mudança de tema via botões do popup"""
    theme_name = event.target.closest(".theme-option").getAttribute("data-theme")
    if theme_name:
        set_theme(theme_name)


def handle_system_theme_change(event):
    """Manipula mudanças automáticas do tema do sistema"""
    current_theme = get_current_theme()
    if current_theme == "system":
        actual_theme = apply_theme("system")
        update_theme_icon("system", actual_theme)


def update_theme_labels():
    """Atualiza os labels baseado no idioma do navegador"""
    lang = window.navigator.language or window.navigator.userLanguage or "en"
    is_portuguese = lang.startswith("pt")

    labels = document.querySelectorAll(".theme-label")
    themes = ["light", "dark", "system"]

    pt_labels = ["Claro", "Escuro", "Sistema"]
    en_labels = ["Light", "Dark", "System"]

    current_labels = pt_labels if is_portuguese else en_labels

    for i, label in enumerate(labels):
        if i < len(current_labels):
            label.textContent = current_labels[i]


def load_theme(event):
    """Carrega o tema salvo na inicialização"""
    current_theme = get_current_theme()
    actual_theme = apply_theme(current_theme)
    update_theme_icon(current_theme, actual_theme)
    update_active_option(current_theme)
    update_theme_labels()


def process_input(event):
    """Função de exemplo - processa input de teste"""
    input_text = document.querySelector("#teste")
    output_div = document.querySelector("#output")
    if input_text and output_div:
        output_div.innerText = input_text.value


def setup_theme_system():
    """Configura o sistema de temas"""
    # Event listeners para os botões de tema
    theme_options = document.querySelectorAll(".theme-option")
    for option in theme_options:
        option.addEventListener("click", handle_theme_change)

    # Listener para mudanças no tema do sistema
    media_query = window.matchMedia("(prefers-color-scheme: dark)")
    media_query.addListener(handle_system_theme_change)


def main():
    """Função principal"""
    document.addEventListener("DOMContentLoaded", load_theme)
    document.addEventListener("DOMContentLoaded", setup_theme_system)


if __name__ == "__main__":
    main()
