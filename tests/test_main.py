import pytest
import unittest.mock as mock
import sys
import os

# Adiciona o diretório raiz ao path para importar o main.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class MockElement:
    """Mock para elementos do DOM"""

    def __init__(self, tag_name="div", id_attr=None, value="", text_content=""):
        self.tag_name = tag_name
        self.id = id_attr
        self.value = value
        self.innerText = text_content
        self.textContent = text_content
        self.attributes = {}

    def setAttribute(self, name, value):
        self.attributes[name] = value

    def getAttribute(self, name):
        return self.attributes.get(name)


class MockDocument:
    """Mock para o objeto document"""

    def __init__(self):
        self.body = MockElement("body")
        self.elements = {
            "#teste": MockElement("input", "teste", "Isso é um teste!"),
            "#output": MockElement("p", "output", "", "Aguardando processamento..."),
            "h1": MockElement("h1"),
            'button[py-click="process_input"]': MockElement("button"),
        }
        self.event_listeners = {}

    def querySelector(self, selector):
        return self.elements.get(selector)

    def addEventListener(self, event_type, callback):
        if event_type not in self.event_listeners:
            self.event_listeners[event_type] = []
        self.event_listeners[event_type].append(callback)


class MockLocalStorage:
    """Mock para localStorage"""

    def __init__(self):
        self.storage = {}

    def getItem(self, key):
        return self.storage.get(key)

    def setItem(self, key, value):
        self.storage[key] = value

    def removeItem(self, key):
        if key in self.storage:
            del self.storage[key]

    def clear(self):
        self.storage = {}


class MockMediaQueryList:
    """Mock para MediaQueryList"""

    def __init__(self, matches=False):
        self.matches = matches


class MockWindow:
    """Mock para o objeto window"""

    def __init__(self):
        self.match_media_result = MockMediaQueryList()

    def matchMedia(self, query):
        return self.match_media_result


class TestMainFunctions:
    """Testes para as funções do main.py"""

    def setup_method(self):
        """Setup executado antes de cada teste"""
        self.mock_document = MockDocument()
        self.mock_localStorage = MockLocalStorage()
        self.mock_window = MockWindow()

        # Mock dos módulos JavaScript
        self.js_mock = mock.MagicMock()
        self.js_mock.document = self.mock_document
        self.js_mock.localStorage = self.mock_localStorage
        self.js_mock.window = self.mock_window

        # Patch do módulo js
        self.js_patcher = mock.patch.dict("sys.modules", {"js": self.js_mock})
        self.js_patcher.start()

    def teardown_method(self):
        """Cleanup executado após cada teste"""
        self.js_patcher.stop()
        self.mock_localStorage.clear()

    def test_load_theme_with_saved_theme(self):
        """Teste load_theme com tema salvo no localStorage"""
        # Arrange
        self.mock_localStorage.setItem("theme", "dark")

        # Import após o mock estar ativo
        import main

        # Act
        main.load_theme(None)

        # Assert
        assert self.mock_document.body.getAttribute("data-theme") == "dark"

    def test_load_theme_without_saved_theme_prefers_dark(self):
        """Teste load_theme sem tema salvo - preferência sistema escuro"""
        # Arrange
        self.mock_window.match_media_result.matches = True

        # Import após o mock estar ativo
        import main

        # Act
        main.load_theme(None)

        # Assert
        assert self.mock_document.body.getAttribute("data-theme") == "dark"

    def test_load_theme_without_saved_theme_prefers_light(self):
        """Teste load_theme sem tema salvo - preferência sistema claro"""
        # Arrange
        self.mock_window.match_media_result.matches = False

        # Import após o mock estar ativo
        import main

        # Act
        main.load_theme(None)

        # Assert
        assert self.mock_document.body.getAttribute("data-theme") == "light"

    def test_process_input_copies_value_to_output(self):
        """Teste process_input copiando valor do input para output"""
        # Arrange
        test_value = "Novo texto de teste"
        self.mock_document.elements["#teste"].value = test_value

        # Import após o mock estar ativo
        import main

        # Act
        main.process_input(None)

        # Assert
        output_element = self.mock_document.querySelector("#output")
        assert output_element.innerText == test_value  # type: ignore[no-untyped-call]

    def test_process_input_with_empty_value(self):
        """Teste process_input com valor vazio"""
        # Arrange
        self.mock_document.elements["#teste"].value = ""

        # Import após o mock estar ativo
        import main

        # Act
        main.process_input(None)

        # Assert
        output_element = self.mock_document.querySelector("#output")
        assert output_element.innerText == ""  # type: ignore[no-untyped-call]

    def test_process_input_with_special_characters(self):
        """Teste process_input com caracteres especiais"""
        # Arrange
        test_value = "Teste com àçêntõs e símbolos @#$%!"
        self.mock_document.elements["#teste"].value = test_value

        # Import após o mock estar ativo
        import main

        # Act
        main.process_input(None)

        # Assert
        output_element = self.mock_document.querySelector("#output")
        assert output_element.innerText == test_value  # type: ignore[no-untyped-call]

    def test_main_adds_event_listener(self):
        """Teste se main adiciona event listener para DOMContentLoaded"""
        # Import após o mock estar ativo
        import main

        # Act
        main.main()

        # Assert
        assert "DOMContentLoaded" in self.mock_document.event_listeners
        assert len(self.mock_document.event_listeners["DOMContentLoaded"]) == 1
        assert (
            self.mock_document.event_listeners["DOMContentLoaded"][0] == main.load_theme
        )


class TestIntegration:
    """Testes de integração"""

    def setup_method(self):
        """Setup para testes de integração"""
        self.mock_document = MockDocument()
        self.mock_localStorage = MockLocalStorage()
        self.mock_window = MockWindow()

        # Mock dos módulos JavaScript
        self.js_mock = mock.MagicMock()
        self.js_mock.document = self.mock_document
        self.js_mock.localStorage = self.mock_localStorage
        self.js_mock.window = self.mock_window

        # Patch do módulo js
        self.js_patcher = mock.patch.dict("sys.modules", {"js": self.js_mock})
        self.js_patcher.start()

    def teardown_method(self):
        """Cleanup para testes de integração"""
        self.js_patcher.stop()
        self.mock_localStorage.clear()

    def test_complete_workflow_load_theme_and_process_input(self):
        """Teste fluxo completo: load_theme + process_input"""
        # Arrange
        self.mock_localStorage.setItem("theme", "light")
        test_input_value = "Teste de integração"
        self.mock_document.elements["#teste"].value = test_input_value

        # Import após o mock estar ativo
        import main

        # Act
        main.load_theme(None)
        main.process_input(None)

        # Assert
        assert self.mock_document.body.getAttribute("data-theme") == "light"
        output_element = self.mock_document.querySelector("#output")
        assert output_element.innerText == test_input_value  # type: ignore[no-untyped-call]

    def test_multiple_process_input_calls(self):
        """Teste múltiplas chamadas de process_input"""
        # Arrange
        test_values = ["Primeiro teste", "Segundo teste", "Teste final"]

        # Import após o mock estar ativo
        import main

        # Act & Assert
        for value in test_values:
            self.mock_document.elements["#teste"].value = value
            main.process_input(None)
            output_element = self.mock_document.querySelector("#output")
            assert output_element.innerText == value  # type: ignore[no-untyped-call]

    def test_theme_switching_scenarios(self):
        """Teste diferentes cenários de troca de tema"""
        # Import após o mock estar ativo
        import main

        # Cenário 1: Tema salvo 'dark'
        self.mock_localStorage.setItem("theme", "dark")
        main.load_theme(None)
        assert self.mock_document.body.getAttribute("data-theme") == "dark"

        # Cenário 2: Tema salvo 'light'
        self.mock_localStorage.setItem("theme", "light")
        main.load_theme(None)
        assert self.mock_document.body.getAttribute("data-theme") == "light"

        # Cenário 3: Sem tema salvo, preferência escura
        self.mock_localStorage.clear()
        self.mock_window.match_media_result.matches = True
        main.load_theme(None)
        assert self.mock_document.body.getAttribute("data-theme") == "dark"

        # Cenário 4: Sem tema salvo, preferência clara
        self.mock_localStorage.clear()
        self.mock_window.match_media_result.matches = False
        main.load_theme(None)
        assert self.mock_document.body.getAttribute("data-theme") == "light"


class TestMockValidation:
    """Testes para validar se os mocks estão funcionando corretamente"""

    def setup_method(self):
        """Setup para validação dos mocks"""
        self.mock_document = MockDocument()
        self.mock_localStorage = MockLocalStorage()
        self.mock_window = MockWindow()

    def test_mock_document_elements_exist(self):
        """Teste se todos os elementos DOM necessários existem no mock"""
        # Elementos que devem existir
        required_elements = [
            "#teste",
            "#output",
            "h1",
            'button[py-click="process_input"]',
        ]

        for selector in required_elements:
            element = self.mock_document.querySelector(selector)
            assert element is not None, f"Elemento {selector} não encontrado"

    def test_mock_input_initial_value(self):
        """Teste valor inicial do input mock"""
        input_element = self.mock_document.querySelector("#teste")
        assert input_element.value == "Isso é um teste!"  # type: ignore[no-untyped-call]

    def test_mock_output_initial_text(self):
        """Teste texto inicial do output mock"""
        output_element = self.mock_document.querySelector("#output")
        assert output_element.textContent == "Aguardando processamento..."  # type: ignore[no-untyped-call]

    def test_mock_localStorage_operations(self):
        """Teste operações do localStorage mock"""
        # Test setItem/getItem
        self.mock_localStorage.setItem("test", "value")
        assert self.mock_localStorage.getItem("test") == "value"

        # Test getItem com chave inexistente
        assert self.mock_localStorage.getItem("nonexistent") is None

        # Test removeItem
        self.mock_localStorage.removeItem("test")
        assert self.mock_localStorage.getItem("test") is None

        # Test clear
        self.mock_localStorage.setItem("test1", "value1")
        self.mock_localStorage.setItem("test2", "value2")
        self.mock_localStorage.clear()
        assert self.mock_localStorage.getItem("test1") is None
        assert self.mock_localStorage.getItem("test2") is None

    def test_mock_window_matchMedia(self):
        """Teste matchMedia mock"""
        # Test com matches = True
        self.mock_window.match_media_result.matches = True
        result = self.mock_window.matchMedia("(prefers-color-scheme: dark)")
        assert result.matches is True

        # Test com matches = False
        self.mock_window.match_media_result.matches = False
        result = self.mock_window.matchMedia("(prefers-color-scheme: dark)")
        assert result.matches is False
