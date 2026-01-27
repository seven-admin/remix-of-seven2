

# Plano: Registrar Motivo de Cancelamento de Visitas pelo Cliente

## Contexto

O diálogo "Marcar Perdido" implementado anteriormente é para o módulo de **Clientes** (quando um cliente sai do funil de vendas). O que você precisa agora é diferente:

**Novo Requisito**: Quando um **cliente cancela uma visita agendada**, o sistema deve capturar o motivo para gerar métricas sobre cancelamentos de atividades.

## Diferença entre os Conceitos

| Conceito | Módulo | Exemplo |
|----------|--------|---------|
| Cliente Perdido | Clientes | "Cliente desistiu de comprar imóvel" |
| Visita Cancelada | Atividades | "Cliente desmarcou a visita agendada" |

## Solução Proposta

### 1. Alteração no Banco de Dados

Adicionar coluna `motivo_cancelamento` na tabela `atividades`:

```sql
ALTER TABLE atividades 
ADD COLUMN motivo_cancelamento TEXT;
```

### 2. Motivos Pré-definidos para Cancelamento de Visita

Sugestões de motivos comuns:
- **Cliente desmarcou** - Cliente avisou que não pode comparecer
- **Sem retorno / Não atende** - Não confirmou presença
- **Reagendou** - Mudou para outra data
- **Não compareceu** - Cliente faltou sem avisar
- **Problema de agenda do corretor** - Corretor/imobiliária indisponível
- **Outro** - Motivo personalizado

### 3. Novo Diálogo: CancelarAtividadeDialog

Similar ao `MarcarPerdidoDialog`, mas focado em atividades:

```text
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Cancelar Atividade                                       │
│                                                              │
│  Registre o motivo do cancelamento:                         │
│  ○ Cliente desmarcou                                        │
│  ○ Sem retorno / Não atende                                 │
│  ○ Reagendou                                                │
│  ○ Não compareceu                                           │
│  ○ Problema de agenda do corretor                           │
│  ○ Outro                                                    │
│                                                              │
│  Observações (opcional):                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Detalhes adicionais...                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│                      [Voltar]  [Confirmar Cancelamento]     │
└─────────────────────────────────────────────────────────────┘
```

### 4. Fluxo de Uso

1. Gestor agenda uma visita para o cliente
2. Cliente cancela a visita
3. Gestor clica em "Cancelar Atividade" 
4. Abre o diálogo para selecionar o motivo
5. Sistema salva o status como 'cancelada' + motivo_cancelamento
6. Métricas ficam disponíveis para análise

## Arquivos a Criar/Modificar

### Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/atividades/CancelarAtividadeDialog.tsx` | Diálogo com motivos de cancelamento |

### Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/atividades.types.ts` | Adicionar constante `MOTIVOS_CANCELAMENTO` e campo na interface |
| `src/hooks/useAtividades.ts` | Modificar `useCancelarAtividade` para aceitar motivo |
| `src/pages/Atividades.tsx` | Integrar o novo diálogo nas ações de cancelar |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Exibir motivo quando atividade cancelada |

### Migração SQL

Adicionar coluna na tabela:
```sql
ALTER TABLE atividades 
ADD COLUMN motivo_cancelamento TEXT;
```

## Métricas Possíveis

Com o campo `motivo_cancelamento` preenchido, você poderá:
- Quantificar visitas canceladas por motivo
- Identificar padrões (ex: muitos "não compareceu" = clientes frios)
- Comparar taxa de cancelamento por corretor/empreendimento
- Criar dashboard de efetividade de agendamentos

## Seção Técnica

### Interface CancelarAtividadeData

```typescript
export interface CancelarAtividadeData {
  motivo_cancelamento: string;
}
```

### Hook Atualizado

```typescript
export function useCancelarAtividade() {
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase
        .from('atividades')
        .update({ 
          status: 'cancelada',
          motivo_cancelamento: motivo.toUpperCase()
        })
        .eq('id', id);
      if (error) throw error;
    },
    // ...
  });
}
```

### Constante de Motivos

```typescript
export const MOTIVOS_CANCELAMENTO_ATIVIDADE = [
  'Cliente desmarcou',
  'Sem retorno / Não atende',
  'Reagendou',
  'Não compareceu',
  'Problema de agenda do corretor',
  'Outro'
] as const;
```

