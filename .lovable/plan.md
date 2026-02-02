
# Plano: Liberar Acesso ao Planejamento para Funcionarios da Seven

## Problema Identificado

O modulo de **Planejamento** nao aparece no menu lateral para funcionarios da Seven (gestor_produto, diretor_de_marketing, supervisao_de_criacao, etc.) porque:

1. **O modulo `planejamento` nao existe** na tabela `modules`
2. Sem o modulo registrado, `canAccessModule('planejamento')` retorna `false` para nao-admins
3. O Sidebar filtra itens de menu baseado em `canAccessModule()`, ocultando o Planejamento

A funcao RLS `is_seven_team()` ja permite leitura para todos os funcionarios, mas o controle de navegacao no frontend bloqueia o acesso.

---

## Solucao

### 1. Criar Modulos de Planejamento

Inserir na tabela `modules`:

```sql
INSERT INTO public.modules (id, name, display_name, description, route, is_active)
VALUES 
  (gen_random_uuid(), 'planejamento', 'Cronograma de Planejamento', 'Visualizacao do cronograma de obras', '/planejamento', true),
  (gen_random_uuid(), 'planejamento_config', 'Configuracoes do Planejamento', 'Gerenciamento de fases e status', '/planejamento/configuracoes', true);
```

### 2. Adicionar Permissoes para Funcionarios Seven

Inserir em `role_permissions` para os seguintes roles:

| Role | planejamento | planejamento_config |
|------|--------------|---------------------|
| gestor_produto | view ✓ | - |
| diretor_de_marketing | view ✓ | - |
| supervisao_de_criacao | view ✓ | - |

**Permissoes para `planejamento`:**
- `can_view: true` (visualizar cronograma)
- `can_create: false` (criacao restrita a admin)
- `can_edit: false` (edicao restrita a admin)
- `can_delete: false` (exclusao restrita a admin)
- `scope: 'empreendimento'` (ve apenas empreendimentos vinculados)

**Nota:** `planejamento_config` permanece apenas para admins (ja controlado via `adminOnly: true` no Sidebar).

---

## SQL Completo

```sql
-- 1. Criar modulos
INSERT INTO public.modules (id, name, display_name, description, route, is_active)
VALUES 
  (gen_random_uuid(), 'planejamento', 'Cronograma de Planejamento', 
   'Visualizacao do cronograma de obras e tarefas', '/planejamento', true),
  (gen_random_uuid(), 'planejamento_config', 'Configuracoes do Planejamento', 
   'Gerenciamento de fases e status do planejamento', '/planejamento/configuracoes', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Adicionar permissoes de visualizacao para funcionarios Seven
WITH 
  planejamento_module AS (
    SELECT id FROM public.modules WHERE name = 'planejamento'
  ),
  seven_roles AS (
    SELECT id, name FROM public.roles 
    WHERE name IN ('gestor_produto', 'diretor_de_marketing', 'supervisão_de_criação')
    AND is_active = true
  )
INSERT INTO public.role_permissions (
  id, role_id, module_id, can_view, can_create, can_edit, can_delete, scope
)
SELECT 
  gen_random_uuid(),
  sr.id,
  pm.id,
  true,   -- can_view
  false,  -- can_create (restrito a admin)
  false,  -- can_edit (restrito a admin)
  false,  -- can_delete (restrito a admin)
  'empreendimento'::scope_type
FROM seven_roles sr
CROSS JOIN planejamento_module pm
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view;
```

---

## Arquivos que NAO Precisam de Alteracao

| Arquivo | Motivo |
|---------|--------|
| `src/components/layout/Sidebar.tsx` | Ja usa `moduleName: 'planejamento'` corretamente |
| `src/App.tsx` | Ja protege rotas com `moduleName="planejamento"` |
| `src/pages/Planejamento.tsx` | Ja verifica `isAdmin()` para botoes de edicao |
| Politicas RLS | Ja usam `is_seven_team()` para leitura |

---

## Resultado Esperado

Apos a migracao:

1. **Gestor de Produto, Diretor de Marketing, Supervisores**: Verao o menu "Planejamento > Cronograma" no Sidebar
2. **Acesso somente leitura**: Poderao visualizar Timeline e Dashboard, mas sem botoes de edicao/importacao
3. **Administradores**: Continuam com acesso total (criar, editar, deletar, configurar)
4. **Incorporadores/Corretores**: Continuam sem acesso ao Planejamento interno (usam seus portais)

---

## Fluxo de Verificacao Pos-Implementacao

1. Fazer login com um usuario `gestor_produto`
2. Verificar se o menu "Planejamento" aparece no Sidebar
3. Acessar `/planejamento`
4. Confirmar que a pagina carrega e mostra os empreendimentos vinculados
5. Confirmar que botoes de Importar/Exportar **nao aparecem** (somente admin)
