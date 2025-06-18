import os
import re
import json
from pathlib import Path
import subprocess


def extract_dependencies_from_css(css_file):
    """Extrai dependências de arquivos CSS"""
    dependencies = set()

    if not os.path.exists(css_file):
        return dependencies

    with open(css_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Busca por url() no CSS
    url_pattern = r'url\(["\']?([^"\')]+)["\']?\)'
    urls = re.findall(url_pattern, content)

    for url in urls:
        if not url.startswith(("http", "data:", "#")):
            # Resolve caminho relativo ao CSS
            css_dir = os.path.dirname(css_file)
            dep_path = os.path.normpath(os.path.join(css_dir, url))
            if os.path.exists(dep_path):
                # Normaliza o caminho para usar barras normais
                dependencies.add(dep_path.replace("\\", "/"))

    return dependencies


def extract_dependencies_from_python(py_file):
    """Extrai dependências de arquivos Python"""
    dependencies = set()

    if not os.path.exists(py_file):
        return dependencies

    with open(py_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Busca por imports locais (arquivos .py)
    import_patterns = [
        r"from\s+(\w+)\s+import",
        r"import\s+(\w+)",
        r'from\s+["\']([^"\']+)["\']',  # from "path" import
        r'import\s+["\']([^"\']+)["\']',  # import "path"
    ]

    for pattern in import_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            # Exclui imports padrão e de terceiros conhecidos
            if match not in [
                "js",
                "sys",
                "os",
                "pytest",
                "unittest",
                "json",
                "re",
                "pathlib",
            ]:
                py_path = f"{match}.py"
                if os.path.exists(py_path):
                    dependencies.add(py_path)

    return dependencies


def get_file_size_mb(filepath):
    """Retorna o tamanho do arquivo em MB"""
    if os.path.isfile(filepath):
        return os.path.getsize(filepath) / (1024 * 1024)
    elif os.path.isdir(filepath):
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(filepath):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                try:
                    total_size += os.path.getsize(file_path)
                except (OSError, IOError):
                    pass  # Ignora arquivos inacessíveis
        return total_size / (1024 * 1024)
    return 0


def scan_css_dependencies():
    """Escaneia todos os arquivos CSS relevantes"""
    css_files = []

    # Busca CSS em diretórios comuns
    css_directories = [
        "public/styles/css/",
        "public/styles/output/",
        "node_modules/bulma/css/",
    ]

    for css_dir in css_directories:
        if os.path.exists(css_dir):
            for file in os.listdir(css_dir):
                if file.endswith((".css", ".min.css")):
                    css_files.append(os.path.join(css_dir, file))

    return css_files


def scan_minimal_dependencies():
    """Escaneia apenas as dependências realmente necessárias"""
    essential_files = set()
    optional_files = set()

    # Arquivos principais obrigatórios
    main_files = ["index.html", "main.py"]

    for file_path in main_files:
        if os.path.exists(file_path):
            essential_files.add(file_path)

            # Analisa dependências específicas
            if file_path.endswith(".py"):
                deps = extract_dependencies_from_python(file_path)
                essential_files.update(deps)

    # Escaneia todos os CSS files
    css_files = scan_css_dependencies()
    for css_file in css_files:
        if os.path.exists(css_file):
            essential_files.add(css_file)
            deps = extract_dependencies_from_css(css_file)
            essential_files.update(deps)

    # Apenas fontes realmente usadas no CSS
    font_extensions = {".ttf", ".woff", ".woff2", ".eot"}

    # Define o arquivo CSS de saída principal
    css_output = "public/styles/output/index.css"

    if os.path.exists(css_output):
        with open(css_output, "r", encoding="utf-8") as f:
            css_content = f.read()

        # Busca especificamente por Noto Sans Mono (usado no CSS original)
        if "Noto Sans Mono" in css_content:
            noto_mono_path = "public/styles/fonts/Noto_Sans_Mono/NotoSansMono-VariableFont_wdth,wght.ttf"
            if os.path.exists(noto_mono_path):
                essential_files.add(noto_mono_path)

    # PyScript apenas se usado
    pyscript_core = "public/pyscript/core.js"
    if os.path.exists(pyscript_core):
        size_mb = get_file_size_mb("public/pyscript")
        if size_mb < 10:  # Só inclui se for menor que 10MB
            essential_files.add("public/pyscript/")
        else:
            print(
                f"⚠️  PyScript ({size_mb:.1f}MB) é muito grande, considerando como opcional"
            )
            optional_files.add("public/pyscript/")

    # Favicon (pequeno e essencial)
    favicon_dir = "public/favicon"
    if os.path.exists(favicon_dir):
        essential_files.add("public/favicon/")

    return {
        "essential": sorted(essential_files),
        "optional": sorted(optional_files),
        "stats": {
            "essential_size_mb": sum(get_file_size_mb(f) for f in essential_files),
            "optional_size_mb": sum(get_file_size_mb(f) for f in optional_files),
        },
    }


if __name__ == "__main__":
    result = scan_minimal_dependencies()

    print("🔍 Análise de Dependências Concluída")
    print(f"📁 Arquivos essenciais: {len(result['essential'])}")
    print(f"📦 Tamanho essencial: {result['stats']['essential_size_mb']:.1f}MB")

    if result["optional"]:
        print(f"⚠️  Arquivos opcionais: {len(result['optional'])}")
        print(f"📦 Tamanho opcional: {result['stats']['optional_size_mb']:.1f}MB")

    print("\n📋 Arquivos essenciais:")
    for file in result["essential"]:
        size = get_file_size_mb(file)
        print(
            f"  • {file} ({size:.2f}MB)"
        )  # Salva resultado em formato compatível com minbuild.py
    output_data = {
        "essential": result["essential"],
        "optional": result["optional"],
        "total_size_mb": result["stats"]["essential_size_mb"],
        "stats": result["stats"],
    }

    with open("dependencies.json", "w") as f:
        json.dump(output_data, f, indent=2)

    print("\n✅ Dependências salvas em dependencies.json")
