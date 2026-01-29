
# Plano: Corrigir Acesso dos Perfis de Marketing/Criação

## Problema Identificado

O usuário `criacao1@sevengroup360.com.br` com perfil "Supervisão de Criação" está vendo "Acesso Pendente" porque:

### Causa Raiz 1: Zero Permissões Configuradas
Os roles abaixo não possuem **nenhuma** permissão na tabela `role_permissions`:
- `supervisão_de_criação` (0 permissões)
- `diretor_de_marketing` (0 permissões)

### Causa Raiz 2: Função `is_marketing_supervisor()` Desatualizada
A função verifica roles com nomes **antigos em inglês** que foram deletados:
```sql
-- Atual (incorreto)
r.name IN (
  'supervisor_relacionamento', 
  'supervisor_render', 
  'supervisor_criacao',  -- NÃO EXISTE MAIS
  'supervisor_video', 
  'equipe_marketing',    -- NÃO EXISTE MAIS  
  'diretor_de_marketing'
)
```

Os roles atuais no sistema são:
| name | display_name | tem permissões? |
|------|-------------|-----------------|
| supervisão_de_criação | Supervisão de Criação | NÃO |
| diretor_de_marketing | Diretor de Marketing | NÃO |

---

## Solução

### Etapa 1: Atualizar função `is_marketing_supervisor()`

Incluir o novo nome do role criado dinamicamente:

```sql
CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name IN (
      'supervisor_relacionamento', 
      'supervisor_render', 
      'supervisor_criacao', 
      'supervisor_video', 
      'equipe_marketing',
      'diretor_de_marketing',
      -- NOVOS nomes dinâmicos
      'supervisão_de_criação'
    )
    AND r.is_active = true
  )
$$;
```

### Etapa 2: Inserir Permissões para os Roles

Configurar as permissões dos módulos para os perfis afetados:

```sql
-- IDs dos módulos necessários
-- projetos_marketing: e8d4fe27-a4fe-4033-8b9e-c3795fdb9159
-- relatorios: 713a265f-7007-48bc-b324-2d9eae3faeef
-- eventos: (buscar)
-- briefings: (buscar)

INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  r.id as role_id,
  m.id as module_id,
  true as can_view,
  true as can_create,
  true as can_edit,
  true as can_delete,
  'global' as scope
FROM public.roles r
CROSS JOIN public.modules m
WHERE r.name IN ('supervisão_de_criação', 'diretor_de_marketing')
  AND m.name IN ('projetos_marketing', 'eventos', 'briefings', 'relatorios')
  AND m.is_active = true
ON CONFLICT DO NOTHING;
```

---

## Resumo das Alterações

| Local | Alteração |
|-------|-----------|
| Função SQL `is_marketing_supervisor()` | Adicionar `'supervisão_de_criação'` à lista de roles verificados |
| Tabela `role_permissions` | Inserir permissões para `supervisão_de_criação` e `diretor_de_marketing` nos módulos de marketing, eventos, briefings e relatórios |

---

## Detalhes Técnicos

### Por que o usuário vê "Acesso Pendente"?

O fluxo no frontend:

```
1. AuthContext carrega role = 'supervisão_de_criação'
                    ↓
2. usePermissions busca permissões do role
                    ↓
3. SELECT * FROM role_permissions WHERE role_id = 'e4c5edac...'
                    ↓
4. Retorna: 0 registros (role não tem permissões!)
                    ↓
5. permissions = [] (array vazio)
                    ↓
6. hasAnyViewPermission([]) = false
                    ↓
7. ProtectedRoute redireciona para /sem-acesso
```

### Por que a RLS funciona para alguns casos?

A função `is_marketing_supervisor()` é usada nas políticas RLS das tabelas de marketing (projetos, tarefas, etc.). Ela **já inclui** `diretor_de_marketing`, mas **não inclui** `supervisão_de_criação`.

Mesmo se a RLS permitisse acesso às tabelas, o frontend bloqueia antes porque não encontra permissões na tabela `role_permissions`.

---

## Critérios de Aceite

1. Usuários com role `supervisão_de_criação` podem acessar `/marketing`
2. Usuários com role `supervisão_de_criação` podem acessar `/eventos`
3. Usuários com role `supervisão_de_criação` podem acessar `/marketing/briefings`
4. Usuários com role `supervisão_de_criação` podem acessar `/relatorios`
5. Usuários com role `diretor_de_marketing` têm os mesmos acessos
6. A função `is_marketing_supervisor()` reconhece o novo nome do role
7. Políticas RLS das tabelas de marketing permitem acesso aos dados

---

## Considerações Adicionais

O sistema possui roles dinâmicos (criados via interface) mas algumas partes ainda dependem de nomes hardcoded. Seria recomendado criar uma flag na tabela `roles` como `is_marketing_team` para evitar hardcoding de nomes, mas isso é uma melhoria futura.
