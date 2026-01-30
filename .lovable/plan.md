

# Plano: Restrições de Permissão, Portal Incorporador e Desativação de Usuários

## Resumo das Solicitações
1. **Planejamento somente para Admins**: Apenas super_admin e admin podem criar/editar itens do planejamento
2. **Portal do Incorporador - Visualização**: Adicionar aba de Planejamento no portal para leitura
3. **Desativar Usuários**: Forma de "esconder" usuários inativos das listas de seleção, mantendo histórico

---

## 1. Restringir Edição do Planejamento para Admins

### Alterações no Componente `PlanejamentoPlanilha.tsx`
- Usar o hook `usePermissions()` para verificar se o usuário é admin
- Definir `readOnly` automaticamente quando não for admin/super_admin
- Ocultar botões de criar, editar, duplicar e excluir para não-admins

### Alterações no Componente `PlanejamentoTimeline.tsx`
- Adicionar prop `readOnly` similar à planilha
- Desativar interações de edição quando `readOnly=true`

### Alterações na Página `Planejamento.tsx`
- Passar `readOnly={!isAdmin()}` para os componentes filhos
- Ocultar botões de Importar/Exportar para não-admins

### Políticas RLS (Banco de Dados)
- A política de INSERT/UPDATE/DELETE na tabela `planejamento_itens` já deve restringir apenas para admins
- Adicionar verificação explícita via RLS:
  - `INSERT`: apenas `is_admin(auth.uid())`
  - `UPDATE`: apenas `is_admin(auth.uid())`
  - `DELETE`: apenas `is_admin(auth.uid())`

---

## 2. Aba de Planejamento no Portal do Incorporador

### Nova Página: `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx`
- Reutilizar os componentes `PlanejamentoPlanilha` e `PlanejamentoTimeline`
- Forçar `readOnly={true}` para ambos
- Adicionar seletor de empreendimento filtrado pelos empreendimentos do incorporador
- Usar hook `useIncorporadorEmpreendimentos()` para listar apenas os vinculados

### Atualizar Layout: `PortalIncorporadorLayout.tsx`
- Adicionar novo card de navegação para "Planejamento"
- Configurar título e subtítulo para a nova rota

### Atualizar Rotas: `src/App.tsx`
- Adicionar rota `/portal-incorporador/planejamento`
- Importar o novo componente

### Exportar no Index: `src/pages/portal-incorporador/index.ts`
- Adicionar export do novo componente

---

## 3. Desativação de Usuários nas Listas

### Comportamento Atual
A tabela `profiles` já possui a coluna `is_active` (boolean).

### Problema Atual
O hook `useFuncionariosSeven` já filtra por `is_active = true`, então usuários inativos não aparecem nas listas de seleção de responsáveis. Outros hooks de seleção de usuários podem não ter esse filtro.

### Ajustes Necessários

#### Hook `useFuncionariosSeven.ts`
- Já está correto (filtra `is_active = true`)

#### Verificar outros hooks de seleção de perfis
- Garantir que todos usem `.eq('is_active', true)`

#### UI de Desativação (já existe em `Usuarios.tsx`)
- O switch `is_active` já está presente no formulário de edição
- Quando desativado, o usuário para de aparecer nas listas de seleção
- Os dados históricos (atividades, planejamento, etc.) permanecem vinculados

#### Considerações sobre Dashboards
- Os dashboards já fazem joins com a tabela `profiles` e podem mostrar dados de usuários inativos
- Isso é o comportamento desejado: manter contabilização mesmo após desativação

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/pages/Planejamento.tsx` | Adicionar controle de permissão `readOnly` |
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Já tem `readOnly`, apenas verificar propagação |
| `src/components/planejamento/PlanejamentoTimeline.tsx` | Adicionar prop `readOnly` |
| `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx` | **Criar** - Nova página |
| `src/pages/portal-incorporador/index.ts` | Adicionar export |
| `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` | Adicionar card de navegação |
| `src/App.tsx` | Adicionar rota do planejamento no portal |
| Migração SQL | Adicionar políticas RLS restritivas para INSERT/UPDATE/DELETE |

---

## Detalhes Técnicos

### Política RLS para Planejamento (SQL)
```sql
-- Apenas admins podem inserir
CREATE POLICY "Admins can insert planejamento_itens"
ON public.planejamento_itens FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admins podem atualizar
CREATE POLICY "Admins can update planejamento_itens"
ON public.planejamento_itens FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admins podem deletar
CREATE POLICY "Admins can delete planejamento_itens"
ON public.planejamento_itens FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Políticas similares para planejamento_fases e planejamento_status
```

### Lógica de Permissão no Frontend
```tsx
// Em Planejamento.tsx
const { isAdmin } = usePermissions();
const canEdit = isAdmin();

// Passar para componentes
<PlanejamentoPlanilha 
  empreendimentoId={empreendimentoId} 
  readOnly={!canEdit} 
/>
```

### Filtro de Empreendimentos para Incorporador
```tsx
// Em PortalIncorporadorPlanejamento.tsx
const { empreendimentoIds, empreendimentos } = useIncorporadorEmpreendimentos();

// Seletor mostra apenas empreendimentos vinculados
<Select value={selectedEmp} onValueChange={setSelectedEmp}>
  {empreendimentos.map(emp => (
    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
  ))}
</Select>
```

---

## Resultado Esperado

1. **Usuários não-admin** verão o Planejamento em modo somente leitura (sem botões de ação)
2. **Incorporadores** terão acesso ao Planejamento pelo portal com visualização dos seus empreendimentos
3. **Usuários desativados** deixam de aparecer em seletores de responsáveis mas mantêm seus registros históricos nos dashboards

