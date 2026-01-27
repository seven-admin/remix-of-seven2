
# Plano: Diálogo para Registrar Motivo de Cancelamento/Perda do Cliente

## Objetivo

Criar um diálogo para capturar o motivo quando um cliente é marcado como "perdido" (cancelou o atendimento), permitindo análise posterior dos motivos de perda.

## Solução Proposta

### 1. Criar Componente MarcarPerdidoDialog

Novo componente similar ao `RejeitarDialog` existente, com:
- Lista de motivos pré-definidos (seleção rápida)
- Campo de texto livre para detalhamento
- Obrigatoriedade de informar pelo menos um motivo

```text
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Marcar Cliente como Perdido                             │
│                                                              │
│  Selecione o motivo principal:                              │
│  ○ Desistiu da compra                                       │
│  ○ Comprou com concorrente                                  │
│  ○ Não conseguiu financiamento                              │
│  ○ Sem retorno / Não atende                                 │
│  ○ Fora do perfil                                           │
│  ○ Outro                                                    │
│                                                              │
│  Observações (opcional):                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Detalhes adicionais sobre a perda...                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│                      [Cancelar]  [Confirmar Perda]          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Motivos Pré-definidos

Sugestão de motivos comuns no mercado imobiliário:
- **Desistiu da compra** - Cliente mudou de ideia
- **Comprou com concorrente** - Fechou negócio em outro lugar
- **Não conseguiu financiamento** - Problemas de crédito
- **Sem retorno / Não atende** - Cliente sumiu
- **Fora do perfil** - Não se enquadra no produto
- **Preço / Condições** - Não aceitou as condições comerciais
- **Outro** - Motivo personalizado

### 3. Integração na Página de Clientes

Alterar os callbacks `onMarcarPerdido` para abrir o diálogo ao invés de executar diretamente:

**Antes:**
```typescript
onMarcarPerdido={(id) => marcarPerdidoMutation.mutate({ id })}
```

**Depois:**
```typescript
onMarcarPerdido={(id) => {
  setClienteParaPerder(id);
  setPerdidoDialogOpen(true);
}}
```

## Arquivos a Criar/Modificar

### Criar: `src/components/clientes/MarcarPerdidoDialog.tsx`

Novo componente com:
- Props: `open`, `onOpenChange`, `onConfirm`, `isLoading`, `clienteNome`
- Estado local para motivo selecionado e observações
- RadioGroup para motivos pré-definidos
- Textarea para observações adicionais
- Lógica para combinar motivo + observação no campo `motivo_perda`

### Modificar: `src/pages/Clientes.tsx`

- Adicionar novos estados: `clienteParaPerder`, `perdidoDialogOpen`
- Alterar handlers `onMarcarPerdido` no mobile e desktop
- Adicionar o novo `MarcarPerdidoDialog` no JSX
- Implementar callback que executa a mutation com o motivo

### Criar: `src/types/clientes.types.ts` (atualização)

Adicionar constante com motivos pré-definidos:

```typescript
export const MOTIVOS_PERDA = [
  'Desistiu da compra',
  'Comprou com concorrente',
  'Não conseguiu financiamento',
  'Sem retorno / Não atende',
  'Fora do perfil',
  'Preço / Condições',
  'Outro'
] as const;
```

## Resultado Esperado

1. Ao clicar em "Marcar Perdido", abre um diálogo
2. Usuário seleciona um motivo da lista
3. Opcionalmente adiciona observações
4. Ao confirmar, o cliente é marcado como perdido com o motivo registrado
5. O motivo fica visível no histórico/detalhes do cliente

## Seção Técnica

### Estrutura do Componente

```typescript
interface MarcarPerdidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isLoading?: boolean;
  clienteNome?: string;
}
```

### Combinação de Motivo + Observação

O campo `motivo_perda` receberá o texto combinado:
```typescript
const motivoFinal = observacao 
  ? `${motivoSelecionado}: ${observacao}`
  : motivoSelecionado;
```

### Invalidação de Cache

Não requer alteração - o hook `useMarcarPerdido` já invalida todas as queries necessárias.

### Compatibilidade

O diálogo será integrado tanto na visão desktop (tabela) quanto mobile (cards).
