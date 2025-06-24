#!/usr/bin/env python3
"""
Script para download recursivo de diretórios remotos usando curl.
Uso: python remdir.py <url_base> <diretorio_destino>
"""
import sys
import os
import subprocess
import re
from urllib.parse import urljoin, urlparse, unquote
from pathlib import Path
import concurrent.futures
import time


def get_directory_listing(url):
    """Extrai lista de arquivos de uma página de diretório CDN."""
    try:
        result = subprocess.run(
            ["curl", "-s", "-L", "--max-time", "30", url],
            capture_output=True,
            text=True,
            check=True,
        )
        content = result.stdout

        parsed_url = urlparse(url)
        base_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"

        files = []

        # Padrão para jsDelivr: <a rel="nofollow" href="/npm/brython@3.13.1/unicode.txt">unicode.txt</a>
        if "jsdelivr.net" in url:
            pattern = r'<a[^>]*href="(/npm/[^"]+)"[^>]*>([^<]+)</a>'
            matches = re.findall(pattern, content, re.IGNORECASE)

            for href, text in matches:
                if not href.startswith(("#", "?", "mailto:", "javascript:")):
                    # Converter href relativo para nome de arquivo
                    filename = href.split("/")[-1]
                    if filename and filename != text.strip():
                        # Se termina com / é diretório
                        if href.endswith("/"):
                            files.append(filename + "/")
                        else:
                            files.append(filename)
                    else:
                        # Usar o texto do link como nome
                        if href.endswith("/"):
                            files.append(text.strip() + "/")
                        else:
                            files.append(text.strip())

        # Padrões genéricos para outros CDNs
        else:
            patterns = [
                r'<a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>',  # Links genéricos
                r'href="([^"]+\.[a-zA-Z0-9]+)"',  # Arquivos com extensão
            ]

            for pattern in patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        href, text = match
                        filename = text.strip()
                    else:
                        href = match
                        filename = href.split("/")[-1]

                    filename = unquote(filename)

                    if (
                        filename
                        and not filename.startswith(
                            ("http", "#", "?", "..", "mailto:", "javascript:")
                        )
                        and filename not in [".", "..", "parent", "up"]
                        and ("." in filename or filename.endswith("/"))
                    ):
                        files.append(filename)

        return sorted(list(set(files)))

    except subprocess.CalledProcessError as e:
        print(f"Erro ao acessar {url}: {e}")
        return []


def is_valid_file_url(url):
    """Valida se a URL é de um arquivo válido."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ["http", "https"] and parsed.netloc
    except:
        return False


def download_file(url, dest_path, max_retries=3):
    """Download de arquivo individual usando curl com retry."""
    for attempt in range(max_retries):
        try:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)

            # Verificar se arquivo já existe e tem tamanho > 0
            if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
                print(f"⏭ {dest_path} (já existe)")
                return True

            result = subprocess.run(
                [
                    "curl",
                    "-s",
                    "-L",
                    "--fail",
                    "--max-time",
                    "60",
                    "-o",
                    dest_path,
                    url,
                ],
                check=True,
                capture_output=True,
            )

            # Verificar se o arquivo foi baixado com sucesso
            if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
                print(f"✓ {dest_path}")
                return True
            else:
                os.remove(dest_path) if os.path.exists(dest_path) else None
                raise subprocess.CalledProcessError(1, "curl")

        except subprocess.CalledProcessError as e:
            if attempt < max_retries - 1:
                print(
                    f"⚠ Tentativa {attempt + 1} falhou para {url}, tentando novamente..."
                )
                time.sleep(2**attempt)  # Backoff exponencial
            else:
                print(f"✗ Erro ao baixar {url}: {e}")
                return False
    return False


def download_recursive(
    base_url, dest_dir, current_path="", visited=None, max_workers=4
):
    """Download recursivo de diretório com controle de concorrência."""
    if visited is None:
        visited = set()

    current_url = urljoin(base_url, current_path)

    if current_url in visited:
        return
    visited.add(current_url)

    print(f"🔍 Explorando: {current_url}")
    files = get_directory_listing(current_url)

    if not files:
        print(f"⚠ Nenhum arquivo encontrado em {current_url}")
        return

    # Separar diretórios e arquivos
    directories = [item for item in files if item.endswith("/")]
    regular_files = [item for item in files if not item.endswith("/")]

    # Download de arquivos em paralelo
    if regular_files:
        print(f"📁 {len(regular_files)} arquivos encontrados")
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for item in regular_files:
                # Para jsDelivr, construir URL completa usando a URL original
                if "jsdelivr.net" in base_url:
                    # Extrair caminho base do pacote
                    base_path = base_url.split("/npm/")[1].strip("/")
                    if "/" in base_path:
                        package_path = "/".join(base_path.split("/")[:-1])
                        file_url = f"https://cdn.jsdelivr.net/npm/{package_path}/{item}"
                    else:
                        file_url = f"https://cdn.jsdelivr.net/npm/{base_path}/{item}"
                else:
                    file_url = urljoin(current_url, item)

                local_path = os.path.join(dest_dir, current_path, item)
                future = executor.submit(download_file, file_url, local_path)
                futures.append(future)

            # Aguardar conclusão de todos os downloads
            concurrent.futures.wait(futures)

    # Processar diretórios recursivamente
    for directory in directories:
        new_path = current_path + directory
        download_recursive(base_url, dest_dir, new_path, visited, max_workers)


def main():
    if len(sys.argv) != 3:
        print("Uso: python remdir.py <url_base> <diretorio_destino>")
        print(
            "Exemplo: python remdir.py 'https://cdn.jsdelivr.net/npm/brython@3/' './src/lib/brython/'"
        )
        sys.exit(1)

    base_url = sys.argv[1]
    dest_dir = sys.argv[2]

    # Validar URL base
    if not is_valid_file_url(base_url):
        print(f"✗ URL inválida: {base_url}")
        sys.exit(1)

    # Normalizar URL
    if not base_url.endswith("/"):
        base_url += "/"

    # Criar diretório destino
    Path(dest_dir).mkdir(parents=True, exist_ok=True)

    print(f"🚀 Iniciando download recursivo de {base_url} para {dest_dir}")
    start_time = time.time()

    try:
        download_recursive(base_url, dest_dir)
        elapsed = time.time() - start_time
        print(f"✅ Download concluído em {elapsed:.2f}s")
    except KeyboardInterrupt:
        print("\n⚠ Download interrompido pelo usuário")
    except Exception as e:
        print(f"✗ Erro durante o download: {e}")


if __name__ == "__main__":
    main()
