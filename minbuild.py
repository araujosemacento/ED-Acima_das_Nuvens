import os
import shutil
import json


def build_minimal():
    """Cria um build mínimo baseado nas dependências detectadas"""

    if not os.path.exists("dependencies.json"):
        print("❌ Execute 'npm run deps:scan' primeiro!")
        return

    with open("dependencies.json", "r") as f:
        data = json.load(f)  # Limpa diretório de build
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    os.makedirs("dist")

    print(f"📦 Construindo build mínimo com {len(data['essential'])} arquivos...")

    copied_count = 0
    for dep in data["essential"]:
        if os.path.exists(dep):
            if os.path.isfile(dep):
                dest_dir = os.path.dirname(f"dist/{dep}")
                if dest_dir:
                    os.makedirs(dest_dir, exist_ok=True)
                shutil.copy2(dep, f"dist/{dep}")
                print(f"  ✓ {dep}")
                copied_count += 1
            elif os.path.isdir(dep):
                dest_path = f"dist/{dep}"
                if os.path.exists(dest_path):
                    shutil.rmtree(dest_path)
                shutil.copytree(dep, dest_path)
                print(f"  ✓ {dep}/ (diretório)")
                copied_count += 1
        else:
            print(f"  ⚠️ Não encontrado: {dep}")

    size_info = data.get(
        "total_size_mb", data.get("stats", {}).get("essential_size_mb", 0)
    )
    print(f"\n🎉 Build concluído!")
    print(f"📁 Arquivos copiados: {copied_count}/{len(data['essential'])}")
    print(f"📦 Tamanho estimado: {size_info:.1f}MB")
    print("📁 Arquivos em ./dist/")


if __name__ == "__main__":
    build_minimal()
