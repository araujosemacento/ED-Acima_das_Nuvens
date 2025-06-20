import os
import shutil
import json


def build_minimal():
    """Cria um build mínimo baseado nas dependências detectadas"""

    if not os.path.exists("dependencies.json"):
        print("❌ Execute 'npm run deps:scan' primeiro!")
        return

    with open("dependencies.json", "r") as f:
        data = json.load(f)
    
    # Limpa diretório de build
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
                # Remove trailing slash para consistência
                clean_dep = dep.rstrip("/")
                dest_path = f"dist/{clean_dep}"
                if os.path.exists(dest_path):
                    shutil.rmtree(dest_path)
                shutil.copytree(dep, dest_path)
                print(f"  ✓ {dep} (diretório)")
                copied_count += 1

    # Verifica se arquivos críticos foram copiados
    critical_files = [
        "dist/public/alpine.js",
        "dist/public/ionicons/ionicons.esm.js",
        "dist/public/ionicons/svgs/sunny.svg"
    ]
    
    missing_files = [f for f in critical_files if not os.path.exists(f)]
    if missing_files:
        print("\n⚠️  Arquivos críticos não copiados:")
        for f in missing_files:
            print(f"  - {f}")
    else:
        print("\n✅ Todos os arquivos críticos foram copiados")

    print(f"\n✅ Build concluído: {copied_count} itens copiados para dist/")
    
    # Calcula tamanho final
    total_size = sum(
        os.path.getsize(os.path.join(dirpath, filename))
        for dirpath, _, filenames in os.walk("dist")
        for filename in filenames
    ) / (1024 * 1024)
    
    print(f"📊 Tamanho final: {total_size:.1f}MB")


if __name__ == "__main__":
    build_minimal()
