# Script Python de exemplo para demonstrar a funcionalidade
# Este arquivo pode ser carregado e executado pela pyodideStore

def saudacao(nome="Desenvolvedor"):
    """Função de saudação personalizada"""
    return f"🐍 Olá, {nome}! Bem-vindo ao Pyodide!"

def calcular_fibonacci(n):
    """Calcula sequência de Fibonacci até n termos"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

def operacoes_matematicas(a, b):
    """Realiza operações matemáticas básicas"""
    return {
        'soma': a + b,
        'subtracao': a - b,
        'multiplicacao': a * b,
        'divisao': a / b if b != 0 else 'Divisão por zero!',
        'potencia': a ** b
    }

# Execução de exemplo quando o script é carregado
print("📜 Script exemplo.py carregado com sucesso!")
print(saudacao("ED Acima das Nuvens"))

# Exemplos de uso
numeros_fib = calcular_fibonacci(10)
print(f"🔢 Fibonacci (10 termos): {numeros_fib}")

operacoes = operacoes_matematicas(15, 3)
print(f"🧮 Operações com 15 e 3: {operacoes}")

# Resultado para retorno
resultado_exemplo = {
    'saudacao': saudacao(),
    'fibonacci': numeros_fib[:5],  # Primeiros 5 números
    'operacao_exemplo': operacoes['soma']
}

resultado_exemplo
