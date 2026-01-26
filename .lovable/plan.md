

# Plano: Corrigir Acesso do Diretor de Marketing aos Tickets

## Problema Identificado

Os tickets sumiram para Jéssica porque as políticas de RLS (Row Level Security) não reconhecem o role `diretor_de_marketing` como alguém com permissão de visualização.

### Políticas Atuais da Tabela `projetos_marketing`

| Política | Condição | Jéssica passa? |
|----------|----------|----------------|
| Admins can manage | `is_admin(auth.uid())` | **Não** (ela não é admin) |
| Clientes can view own | `cliente_id = auth.uid()` | **Não** (ela não é cliente) |
| Supervisores can manage | `is_marketing_supervisor(auth.uid())` | **Não** (role não incluído) |

### Função `is_marketing_supervisor()` (atual)

```sql
SELECT EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN (
    'supervisor_relacionamento',
    'supervisor_render', 
    'supervisor_criacao',
    'supervisor_video',
    'equipe_marketing'
  )  -- ← 'diretor_de_marketing' NÃO ESTÁ AQUI!
  AND r.is_active = true
)
```

## Solução

Atualizar a função `is_marketing_supervisor()` para incluir o role `diretor_de_marketing`.

### Migração SQL

```sql
CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
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
      'diretor_de_marketing'  -- ← ADICIONAR ESTE ROLE
    )
    AND r.is_active = true
  )
$$;
```

## Fluxo Após Correção

```text
Jéssica (diretor_de_marketing) → SELECT projetos_marketing
                                        ↓
                            RLS verifica políticas
                                        ↓
                     is_marketing_supervisor(jéssica_id)
                                        ↓
              role 'diretor_de_marketing' IN lista? → SIM ✓
                                        ↓
                              Retorna TRUE → ACESSO LIBERADO
```

## Resultado Esperado

Após a migração:
- Jéssica verá todos os tickets no Kanban de Marketing
- Poderá criar, editar e mover tickets normalmente
- Outros usuários com roles de marketing continuarão funcionando

## Resumo das Alterações

| Tipo | Descrição |
|------|-----------|
| Migração SQL | Atualizar função `is_marketing_supervisor()` para incluir `diretor_de_marketing` |

