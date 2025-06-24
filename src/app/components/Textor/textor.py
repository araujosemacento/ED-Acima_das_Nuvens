# Script do componente Textor

# Processa as props
conteudo = props.get("conteudo", "Texto padrão do Textor")
print(f"Textor carregado com conteúdo: {conteudo}")

# Se não há conteúdo específico, usa um padrão
if not conteudo or conteudo == "Texto padrão do Textor":
    # Atualiza o elemento com conteúdo padrão
    text_element = element.querySelector("p")
    if text_element:
        text_element.innerHTML = "Este é o componente Textor funcionando!"

# Adiciona estilo específico
element.style.color = "#26a69a"
element.style.fontWeight = "bold"
