# Script do componente Butaun
from browser import window

# Processa as props recebidas
titulo = props.get("titulo", "Botão Padrão")
print(f"Butaun carregado com título: {titulo}")


# Função para o onclick do botão
def butaun_click():
    window.alert(f"Butaun '{titulo}' foi clicado!")


# Torna a função disponível globalmente
window.butaunClick = butaun_click

# Adiciona classe CSS específica do componente
element.classList.add("butaun-component")
