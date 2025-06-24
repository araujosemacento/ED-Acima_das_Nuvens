from browser import document as dom, ajax  # type: ignore
import re


class ComponentSystem:
    """Sistema de componentes recursivo similar ao React com Props"""

    def __init__(self):
        self.components_cache = {}
        self.base_path = "/app/"
        self.props_store = {}  # Armazena props para cada instância de componente

    def load_component(self, component_name, target_element=None, props=None):
        """Carrega um componente HTML e processa sub-componentes recursivamente"""

        # Se não foi especificado um elemento alvo, procura pelo nome do componente
        if target_element is None:
            target_element = dom.querySelector(component_name)

        if not target_element:
            print(f"Elemento <{component_name}/> não encontrado")
            return

        # Extrai props do elemento se não foram fornecidas
        if props is None:
            props = self._extract_props_from_element(target_element)

        # Armazena props para este componente
        component_id = id(target_element)
        self.props_store[component_id] = props

        # Determina o caminho do arquivo HTML do componente
        component_paths = self._resolve_component_paths(component_name)

        # Tenta carregar o componente
        self._try_load_component(component_paths, target_element, component_name, props)

    def _extract_props_from_element(self, element):
        """Extrai props dos atributos do elemento"""
        props = {}
        for attr in element.attributes:
            if attr.name not in ["class", "id", "style"]:
                props[attr.name] = attr.value
        return props

    def _resolve_component_paths(self, component_name):
        """Resolve possíveis caminhos para o componente (estrutura de pastas flexível)"""
        base_name = component_name.lower()

        # Opções de caminhos (ordem de prioridade)
        return [
            f"{self.base_path}components/{component_name}/{base_name}.html",  # app/components/Butaun/butaun.html
            f"{self.base_path}components/{base_name}.html",  # app/components/butaun.html
            f"{self.base_path}{base_name}.html",  # app/butaun.html
            f"{self.base_path}{component_name}.html",  # app/Butaun.html
        ]

    def _try_load_component(self, paths, target_element, component_name, props):
        """Tenta carregar o componente testando diferentes caminhos"""

        def try_next_path(index=0):
            if index >= len(paths):
                # Nenhum caminho funcionou
                print(f"Componente '{component_name}' não encontrado em nenhum caminho")
                target_element.innerHTML = f"<div style='color: red;'>Erro: Componente '{component_name}' não encontrado</div>"
                return

            path = paths[index]

            def on_complete(req):
                if req.status == 200:
                    self._render_component(
                        req.text, target_element, component_name, props, path
                    )
                else:
                    # Tenta próximo caminho
                    try_next_path(index + 1)

            def on_error(req):
                # Tenta próximo caminho
                try_next_path(index + 1)

            req = ajax.Ajax()
            req.bind("complete", on_complete)
            req.bind("error", on_error)
            req.open("GET", path, True)
            req.send()

        try_next_path()

    def _render_component(
        self, html_content, target_element, component_name, props, component_path
    ):
        """Renderiza o componente e processa Props"""

        # Processa Props no HTML
        processed_html = self._process_props_in_html(html_content, props)

        # Substitui o elemento pelo conteúdo do componente
        target_element.outerHTML = processed_html

        # Re-busca o elemento após substituição
        new_element = dom.querySelector(f"[data-component='{component_name}']")
        if not new_element:
            # Se não tem data-component, pega o primeiro elemento inserido
            new_element = target_element.parentNode.lastElementChild

        # Processa sub-componentes recursivamente
        self._process_subcomponents(new_element)

        # Executa scripts Python associados se existir
        self._execute_component_scripts(
            component_name, new_element, props, component_path
        )

        print(f"Componente '{component_name}' carregado: {component_path}")

    def _process_props_in_html(self, html_content, props):
        """Processa tags <Props /> no HTML substituindo por valores"""

        def replace_props(match):
            prop_name = match.group(1) if match.group(1) else "children"
            return props.get(prop_name, "")

        # Substitui <Props key="value" /> e <Props />
        html_content = re.sub(
            r'<Props\s*(?:key=["\']([^"\']*)["\'])?\s*/>', replace_props, html_content
        )

        # Adiciona data-component para identificação
        if "<div" in html_content or "<span" in html_content:
            html_content = re.sub(
                r"<(div|span)", r'<\1 data-component="true"', html_content, count=1
            )

        return html_content

    def _process_subcomponents(self, container):
        """Processa componentes filhos recursivamente (boneca russa)"""

        # Busca apenas por componentes que começam com letra maiúscula
        custom_elements = container.querySelectorAll("*")

        for element in custom_elements:
            tag_name = element.tagName

            # Verifica se é um componente customizado (primeira letra maiúscula)
            if self._is_custom_component(tag_name):
                # Carrega o sub-componente recursivamente
                self.load_component(tag_name, element)

    def _is_custom_component(self, tag_name):
        """Verifica se é um componente customizado (primeira letra maiúscula)"""
        return (
            tag_name
            and tag_name[0].isupper()
            and tag_name
            not in [
                "DIV",
                "SPAN",
                "P",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "A",
                "IMG",
                "UL",
                "OL",
                "LI",
                "NAV",
                "HEADER",
                "FOOTER",
                "SECTION",
                "ARTICLE",
                "ASIDE",
                "MAIN",
                "BUTTON",
                "INPUT",
                "FORM",
                "TEXTAREA",
                "SELECT",
                "OPTION",
                "TABLE",
                "TR",
                "TD",
                "TH",
                "THEAD",
                "TBODY",
                "TFOOT",
            ]
        )

    def _execute_component_scripts(
        self, component_name, element, props, component_path
    ):
        """Executa scripts Python associados ao componente"""

        # Calcula o caminho do script baseado no caminho do HTML
        script_paths = self._get_script_paths(component_name, component_path)

        # Processa scripts declarados no HTML
        self._process_inline_scripts(element, props)

        # Tenta carregar script automático do componente
        self._load_component_script(script_paths, element, component_name, props)

    def _get_script_paths(self, component_name, component_path):
        """Gera possíveis caminhos para o script do componente"""
        base_name = component_name.lower()

        if "/components/" in component_path:
            # Se está em uma pasta de componente, procura na mesma pasta
            dir_path = component_path.rsplit("/", 1)[0]
            return [f"{dir_path}/{base_name}.py"]
        else:
            # Senão, procura nos locais padrão
            return [
                f"{self.base_path}components/{component_name}/{base_name}.py",
                f"{self.base_path}components/{base_name}.py",
                f"{self.base_path}{base_name}.py",
            ]

    def _process_inline_scripts(self, element, props):
        """Processa scripts declarados inline no HTML"""
        scripts = element.querySelectorAll('script[type="text/python"]')

        for script in scripts:
            src = script.getAttribute("src")
            if src:
                self._load_external_script(src, element, props)
            else:
                # Script inline
                script_content = script.innerHTML
                self._execute_script_content(script_content, element, props)

    def _load_external_script(self, src, element, props):
        """Carrega script externo"""

        def on_complete(req):
            if req.status == 200:
                self._execute_script_content(req.text, element, props)

        req = ajax.Ajax()
        req.bind("complete", on_complete)
        req.open("GET", src, True)
        req.send()

    def _load_component_script(self, script_paths, element, component_name, props):
        """Tenta carregar script automático do componente"""

        def try_script_path(index=0):
            if index >= len(script_paths):
                return  # Nenhum script encontrado (não é erro)

            path = script_paths[index]

            def on_complete(req):
                if req.status == 200:
                    self._execute_script_content(req.text, element, props)
                else:
                    try_script_path(index + 1)

            def on_error(req):
                try_script_path(index + 1)

            req = ajax.Ajax()
            req.bind("complete", on_complete)
            req.bind("error", on_error)
            req.open("GET", path, True)
            req.send()

        try_script_path()

    def _execute_script_content(self, script_content, element, props):
        """Executa conteúdo do script Python"""
        try:
            # Contexto disponível para o script
            script_globals = {
                "dom": dom,
                "element": element,
                "props": props,
                "ajax": ajax,
            }
            exec(script_content, script_globals)
        except Exception as e:
            print(f"Erro ao executar script: {e}")

    def mount_app(self):
        """Monta a aplicação principal"""
        app_element = dom.querySelector("app")
        if app_element:
            self.load_component("app", app_element)
        else:
            print("Elemento <app/> não encontrado")


# Inicializa o sistema de componentes
component_system = ComponentSystem()


# Aguarda o DOM estar pronto e monta a aplicação
def init_app():
    component_system.mount_app()


# Se o DOM já estiver carregado, inicializa imediatamente
if dom.readyState == "complete":
    init_app()
else:
    # Caso contrário, aguarda o evento DOMContentLoaded
    dom.addEventListener("DOMContentLoaded", lambda e: init_app())
