# Plano: CRUD Completo para Propostas, Contratos e Eventos

## Analise do Estado Atual

### 1. Propostas - Estado Atual
**Hook (`usePropostas.ts`):**
- [x] CREATE: `useCreateProposta` - funciona
- [x] READ: `usePropostas`, `useProposta` - funciona
- [x] UPDATE: `useUpdateProposta` - existe mas nao tem UI
- [x] DELETE: `useDeleteProposta` - soft delete funciona

**Pagina (`Propostas.tsx`):**
- [x] Listagem com filtros e paginacao
- [x] Criar nova proposta via `PropostaForm`
- [x] Visualizar detalhes via `PropostaDetalheDialog`
- [ ] **FALTA: Editar proposta existente** - nao ha botao de editar nem formulario de edicao
- [x] Excluir proposta (apenas rascunho)
- [ ] **FALTA: Excluir proposta em qualquer status para super admin**

---

### 2. Contratos - Estado Atual
**Hook (`useContratos.ts`):**
- [x] CREATE: `useCreateContrato` - funciona
- [x] READ: `useContratos`, `useContrato`, `useContratosPaginated` - funciona
- [x] UPDATE: `useUpdateContrato`, `useUpdateContratoStatus` - funciona
- [x] DELETE: `useDeleteContrato` - soft delete funciona

**Pagina/Tabela (`Contratos.tsx`, `ContratosTable.tsx`):**
- [x] Listagem com filtros e paginacao
- [x] Criar novo contrato
- [x] Visualizar detalhes
- [x] Editar contrato (via tela de detalhe)
- [x] **Excluir em qualquer status para super admin** - JA IMPLEMENTADO na ultima alteracao

**Verificacao:** A funcionalidade de exclusao para super admin ja foi implementada corretamente em `ContratosTable.tsx` (linhas 85-170).

---

### 3. Eventos - Estado Atual
**Hook (`useEventos.ts`):**
- [x] CREATE: `createEvento` - funciona
- [x] READ: `eventos`, `useEvento` - funciona
- [x] UPDATE: `updateEvento` - funciona
- [x] DELETE: `deleteEvento` - soft delete funciona

**Pagina (`Eventos.tsx`, `EventoDetalhe.tsx`):**
- [x] Listagem com busca
- [x] Criar novo evento (com/sem template)
- [x] Visualizar detalhes
- [x] Editar evento via `EventoEditDialog`
- [ ] **FALTA: Botao de excluir evento** - nao ha opcao de exclusao no menu

---

## Alteracoes Necessarias

### 1. Propostas - Completar CRUD

#### 1.1 Adicionar Edicao de Proposta

**Arquivo: `src/components/propostas/PropostaForm.tsx`**
- Modificar para aceitar `proposta?: Proposta` como prop opcional
- Pre-preencher formulario quando em modo edicao
- Chamar `useUpdateProposta` em vez de `useCreateProposta` quando editando

**Arquivo: `src/pages/Propostas.tsx`**
- Adicionar estado `propostaParaEditar`
- Adicionar botao de "Editar" na coluna de acoes (para rascunho/enviada)
- Passar proposta para o form quando editando

**Arquivo: `src/components/propostas/PropostaDetalheDialog.tsx`**
- Adicionar botao "Editar" no dialog de detalhes

#### 1.2 Permitir Exclusao para Super Admin

**Arquivo: `src/pages/Propostas.tsx`**
- Importar `usePermissions`
- Mostrar botao de excluir para super admin em todos os status

---

### 2. Contratos - Verificar e Confirmar

A funcionalidade de exclusao para super admin **ja esta implementada** em `ContratosTable.tsx`:

```typescript
// Linha 86-91
const isStatusAtivo = ['em_geracao', 'enviado_assinatura', 'assinado', 'enviado_incorporador'].includes(contrato.status);

// Se nao tem acoes de status E nao pode excluir, nao mostra menu
if (!isStatusAtivo && !canDelete) {
  return null;
}
```

E na linha 156-167, o botao de exclusao aparece para super admin independente do status.

**Nenhuma alteracao necessaria** - apenas confirmar que funciona.

---

### 3. Eventos - Adicionar Exclusao

#### 3.1 Adicionar Opcao de Excluir na Listagem

**Arquivo: `src/pages/Eventos.tsx`**
- Adicionar `deleteEvento` do hook
- Adicionar opcao "Excluir" no `DropdownMenu` (mobile e desktop)
- Adicionar confirmacao antes de excluir
- Considerar permissao de super admin para excluir eventos em qualquer status

#### 3.2 Adicionar Opcao de Excluir no Detalhe

**Arquivo: `src/pages/EventoDetalhe.tsx`**
- Adicionar botao "Excluir Evento" (destrutivo)
- Redirecionar para `/eventos` apos exclusao
- Adicionar dialog de confirmacao

---

## Resumo das Alteracoes

| Modulo | Arquivo | Alteracao |
|--------|---------|-----------|
| Propostas | `PropostaForm.tsx` | Suporte a modo edicao |
| Propostas | `Propostas.tsx` | Botao editar + excluir para super admin |
| Propostas | `PropostaDetalheDialog.tsx` | Botao editar no dialog |
| Contratos | - | Nenhuma (ja implementado) |
| Eventos | `Eventos.tsx` | Opcao de excluir no menu |
| Eventos | `EventoDetalhe.tsx` | Botao de excluir na pagina de detalhe |

---

## Fluxo de Implementacao

1. **Propostas - Edicao:**
   - Modificar `PropostaForm` para aceitar proposta existente
   - Adicionar logica de update no submit
   - Adicionar botoes de editar na lista e no dialog

2. **Propostas - Exclusao Super Admin:**
   - Verificar permissao com `usePermissions`
   - Mostrar botao de excluir sempre para super admin

3. **Eventos - Exclusao:**
   - Adicionar opcao no dropdown da listagem
   - Adicionar botao no detalhe do evento
   - Implementar confirmacao e redirect

4. **Testes:**
   - Testar criar/editar/excluir propostas
   - Testar exclusao de contratos aprovados como super admin
   - Testar exclusao de eventos
