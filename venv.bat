@echo off

if not exist .venv (
  echo Ambiente virtual nao encontrado. Criando novo ambiente...
  python -m venv .venv
  
  :: Ativa o ambiente virtual
  call .venv\Scripts\activate.bat
  
  :: Atualiza pip dentro do ambiente virtual
  python -m pip install --upgrade pip
  echo Pip atualizado!
  
  if exist requirements.txt (
    python -m pip install -r requirements.txt
    echo Dependencias instaladas do requirements.txt!
  )
  echo Ambiente virtual criado com sucesso!
  ) else (
  echo Ambiente virtual encontrado!
  
  :: Ativa o ambiente virtual
  call .venv\Scripts\activate.bat
  
  :: Atualiza pip
  python -m pip install --upgrade pip
  echo Pip atualizado!
  
  python -m pip freeze > requirements.txt
  echo Requirements atualizados!
  python -m pip install -r requirements.txt
  echo Dependencias atualizadas!
)

:: Verifica se node_modules existe
if not exist node_modules (
  echo Node modules nao encontrado. Verificando Bun...
  where bun >nul 2>&1
  if %errorlevel% equ 0 (
    echo Instalando dependencias com Bun...
    bun i
    echo Dependencias instaladas com Bun!
    ) else (
    echo Bun nao encontrado. Instalando Bun...
    npm i bun -g -y
    echo Bun instalado! Instalando dependencias...
    bun i
    echo Dependencias instaladas com Bun!
  )
  ) else (
  echo Node modules encontrado!
)

:: Limpa a tela do terminal
cls

:: Indica visualmente que o ambiente está ativado
echo Ambiente virtual ativado! (%VIRTUAL_ENV%)
