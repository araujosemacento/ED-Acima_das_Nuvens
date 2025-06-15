@echo off
:: filepath: c:\Users\Suzuma\Documents\GitHub\ed-acima_das_nuvens\venv.bat

if not exist .venv (
  python -c "print('\033[93mAmbiente virtual nao encontrado. Criando novo ambiente...\033[0m\n')"
  python -m venv .venv
  
  :: Atualiza pip dentro do ambiente virtual
  call powershell -noexit -ExecutionPolicy Bypass -Command "& { .venv\Scripts\Activate.ps1 }"
  python -m pip install --upgrade pip
  
  if exist requirements.txt (
    python -m pip install -r requirements.txt
    python -c "print('\033[96mDependencias instaladas do requirements.txt!\033[0m\n')"
  )
  python -c "print('\033[92mAmbiente virtual criado com sucesso!\033[0m\n')"
  ) else (
  python -c "print('\033[92mAmbiente virtual encontrado!\033[0m\n')"
  
  :: Ativa o ambiente virtual antes de qualquer operação
  call powershell -noexit -ExecutionPolicy Bypass -Command "& { .venv\Scripts\Activate.ps1 }"
  
  python -m pip freeze > requirements.txt
  python -c "print('\033[96mRequirements atualizados!\033[0m\n')"
  python -m pip install -r requirements.txt
  python -c "print('\033[96mDependencias atualizadas!\033[0m\n')"
)

:: Indica visualmente que o ambiente está ativado (usando aspas simples para evitar problemas de escape)
python -c "import sys, os; sys.stdout.write('\033[92mAmbiente virtual ativado! (' + os.environ['VIRTUAL_ENV'].replace('\\', '/') + ')\033[0m\n')"
