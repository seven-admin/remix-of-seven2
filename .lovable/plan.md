

# Plano de Correção: React Error #310 no ContratoDetalhe

## Problema Identificado

O erro React #310 significa: **"Hooks can only be called inside of the body of a function component."**

### Causa Raiz

No arquivo `ContratoDetalhe.tsx`, o hook `useCallback` (linha 137-140) está sendo chamado **DEPOIS** de early returns condicionais:

```typescript
// Linhas 113-119: Early return para loading
if (isLoading) {
  return <div>...</div>;
}

// Linhas 121-128: Early return para contrato não encontrado
if (!contrato) {
  return <div>...</div>;
}

// Linha 137-140: useCallback APÓS os returns - VIOLA A REGRA DOS HOOKS!
const handlePagamentoValidation = useCallback((isValid: boolean, diferenca: number) => {
  setPagamentoValido(isValid);
  setDiferencaPagamento(diferenca);
}, []);
```

Quando o componente está em loading ou quando `contrato` é null, o React retorna antes de chegar ao `useCallback`. Na próxima renderização (quando os dados chegam), o número de hooks chamados muda, causando o erro #310.

---

## Solução

Mover o `useCallback` para **ANTES** de qualquer return condicional, junto com os outros hooks no topo do componente.

### Alteração no Arquivo

**Arquivo:** `src/components/contratos/ContratoDetalhe.tsx`

#### Antes (Linhas 104-140):

```typescript
// Validação completa do contrato
const validacaoContrato = useMemo(() => {
  if (!contrato) return { valido: true, pendencias: [] };
  return validarContratoCompleto(contrato);
}, [contrato]);

const errosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'erro');
const avisosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'aviso');

if (isLoading) {
  return (...);
}

if (!contrato) {
  return (...);
}

const pendenciasAbertas = ...;
const documentosPendentes = ...;
const podeEnviarAssinatura = ...;

// useCallback APÓS early returns - PROBLEMA!
const handlePagamentoValidation = useCallback((isValid: boolean, diferenca: number) => {
  setPagamentoValido(isValid);
  setDiferencaPagamento(diferenca);
}, []);
```

#### Depois:

```typescript
// Callback estável para evitar loops de render infinito
// MOVIDO PARA ANTES DOS EARLY RETURNS
const handlePagamentoValidation = useCallback((isValid: boolean, diferenca: number) => {
  setPagamentoValido(isValid);
  setDiferencaPagamento(diferenca);
}, []);

// Validação completa do contrato
const validacaoContrato = useMemo(() => {
  if (!contrato) return { valido: true, pendencias: [] };
  return validarContratoCompleto(contrato);
}, [contrato]);

const errosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'erro');
const avisosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'aviso');

if (isLoading) {
  return (...);
}

if (!contrato) {
  return (...);
}

const pendenciasAbertas = ...;
const documentosPendentes = ...;
const podeEnviarAssinatura = ...;

// useCallback removido daqui (já está acima)
```

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `src/components/contratos/ContratoDetalhe.tsx` | Mover `useCallback` (linhas 137-140) para a linha 104, antes do `useMemo` e dos early returns |

---

## Regra dos Hooks (Referência)

Os Hooks do React devem:
1. Ser chamados no nível superior do componente
2. Ser chamados na mesma ordem em cada render
3. **NUNCA** ser chamados após condicionais que podem retornar antecipadamente

---

## Critérios de Aceite

1. Abrir um contrato gerado não exibe mais o erro #310
2. A página do contrato carrega corretamente
3. A funcionalidade de validação de pagamento continua funcionando
4. Todos os estados do contrato são exibidos corretamente

