# ED - Acima das Nuvens

__RPG interativo baseado em texto:__ O usuário👤 toma decisões que influenciam um grupo de personagens com um objetivo em comum. Obtendo riquezas e sobrevivendo a uma perigosa aventura sobre as nuvens ☁️.

## 🚀 Desenvolvimento

### Scripts Disponíveis

```bash
# Compilar SASS
npm run build:sass

# Detectar dependências do projeto
npm run deps:scan    # Executa: python dependencies.py

# Construir build mínimo
npm run deps:build   # Executa: python minbuild.py

# Mover arquivos mantendo histórico Git
npm run move:safe pasta_antiga/ pasta_nova/
# ou diretamente:
git mv arquivo_antigo.txt arquivo_novo.txt

# Testes
npm run test
npm run pytest
```

### 🔧 Sistema de Build Otimizado

O projeto usa um sistema de build inteligente que detecta automaticamente apenas os arquivos essenciais:

1. __Detecção de Dependências__ (`dependencies.py`):
   - Analisa arquivos HTML, CSS e Python
   - Identifica dependências reais (não apenas backups)
   - Separa arquivos essenciais dos opcionais
   - Gera `dependencies.json` com a lista otimizada

2. __Construção Mínima__ (`minbuild.py`):
   - Cria diretório `dist/` com apenas arquivos essenciais
   - Reduz tamanho de ~100MB para ~6MB
   - Mantém funcionalidade completa

3. __GitHub Actions__ (`.github/workflows/main.yml`):
   - Executa os scripts automaticamente
   - Publica apenas o build otimizado
   - Acelera deploy e reduz transferência de dados

__Processo automático:__

```bash
# Local (desenvolvimento)
npm run deps:scan    # Detecta dependências
npm run deps:build   # Constrói build mínimo

# GitHub Actions (automático)
python dependencies.py   # Detecta dependências
python minbuild.py      # Constrói build mínimo
# Upload para GitHub Pages
```

### 📁 Gerenciamento de Arquivos

> __⚠️ IMPORTANTE__: A pasta `public/` contém mais de 100MB de conteúdo (fontes, PyScript, etc.)

__Para mover arquivos/pastas mantendo o histórico do Git:__

```bash
# Use sempre git mv em vez de mover manualmente
git mv pasta_antiga/ pasta_nova/
git mv arquivo.txt novo_nome.txt

# Comando disponível via npm:
npm run move:safe public/fonts/ assets/fonts/
```

__Otimizações implementadas:__

- ✅ Build otimizado que inclui apenas arquivos essenciais
- ✅ Detecção automática de dependências CSS/Python  
- ✅ Artefatos GitHub Pages com tamanho reduzido (~10MB vs 100MB+)
- ✅ Scripts npm para facilitar operações Git

## Personagens

- João 👦🏻
- Maria 👧🏻
- Pib 🐈
- Kit 🐈‍⬛
- Ed 🥚

## Objetivo Principal

### Roubar a Gansa 🪿 dos ovos dourados

## Objetivos Secundários

- João 👦🏻: Matar o Gigante🧌
- Maria 👧🏻: Tomar o Castelo🏰
- Pib 🐈: Devorar a Gansa 🪿
- Kit 🐈‍⬛: Tornar-se rica
- Ed 🥚: Obter uma família

## Finais

Cada personagem terá uma ramificação de possíveis finalizações do enredo baseadas em seus objetivos pessoais:

- Neutros
  - João 👦🏻: Obtém vingança contra o Gigante🧌, deixando os demais para trás.
  - Maria 👧🏻: Expulsa o Gigante🧌 e demais personagens do Castelo🏰, tornando-se monarca acima das nuvens☁️.
  - Pib 🐈: Após a fuga com a Gansa 🪿, é bem-sucedido em devorá-la deixando a todos na miséria.
  - Kit 🐈‍⬛: Após a fuga com a Gansa 🪿, forma um cartel voltado para a venda dos ovos dourados no submundo, tornado os demais em seus capangas.
  - Ed 🥚: Entrega os demais ao Gigante🧌, formando um trato para que seja adotado pela Gansa 🪿 em meio aos ovos dourados.
- Desastrosos
  - João 👦🏻: Leva ao óbito todos os integrantes do grupo e a si mesmo para que seja capaz de destruir o Gigante🧌 e seu Castelo🏰.
  - Maria 👧🏻: Incapaz de impedir o desmoronamento do Castelo🏰, é deixada para trás morrendo com o Gigante🧌.
  - Pib 🐈: É morto por Kit🐈‍⬛, que prioriza a segurança da Gansa 🪿.
  - Kit 🐈‍⬛: Tomada por ganância, isola os demais, abandonando-os e fugindo sozinha com a Gansa 🪿, morrendo de fome incapaz de se nutrir dos ovos dourados.
  - Ed 🥚: Incapaz de cumprir seu objetivo, acaba sozinho, consumido pelas chamas ou soterrado sob os escombros.
- Verdadeiros
  - João 👦🏻: Perdoa o Gigante🧌, impedindo o desmoronamento do Castelo🏰 sendo capaz de viver ao lado de todos, acumulando riquezas.
  - Maria 👧🏻: Desapega dos bens materiais, abrindo mão da Gansa 🪿 para garantir a fuga de todos sãos e salvos.
  - Pib 🐈: Perdoa Kit🐈‍⬛ e os demais pelos desentendimentos, salvando a Gansa 🪿 e garantindo o sucesso do grupo.
  - Kit 🐈‍⬛: Reconhece seus erros e se une aos demais para enfrentar o Gigante🧌, garantindo a segurança de todos.
  - Ed 🥚: Aceita sua condição e se sacrifica para salvar os demais, garantindo a fuga de todos, podendo ser salvo pelos demais, concluindo então ter encontrado sua família.

---

### NOTA: O usuário👤 só poderá influenciar as decisões referentes ao personagem previamente escolhido, os personagens que não estiverem sob sua influencia, por padrão terão comportamento que culmina em sua rota neutra resspectiva, a depender da prioridade da rota

---

## Eventos chave

- Morte da família de João através das mãos do Gigante 🧌
- Entrada discreta: Ao se infiltrar discretamente através de uma falha na parede, a falha estrutural causa um efeito borboleta, levando ao desmoronamento do Castelo🏰.
- Furto da Gansa 🪿: Na tentativa de furtar a Gansa 🪿, uma lamparina é derrubada por desatenção, causando um incêndio, gerando uma oportunidade de fuga, ou uma limitação mortal tanto para o Gigante🧌 quanto para o grupo de ladrões.

## Eventos preventivos

- Conserto da estrutura do Castelo🏰: Realizar reparos nas falhas estruturais para evitar o desmoronamento.
- Destruição da Gansa 🪿: Impedir o furto da Gansa 🪿, evitando o incêndio e a fuga do grupo de ladrões.
- Eliminação do Gigante 🧌: Matar o Gigante 🧌 antes que ele possa causar danos extras ao Castelo🏰 e aos demais personagens.
