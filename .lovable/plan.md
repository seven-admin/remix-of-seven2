
# Plano: Corrigir Acesso da Equipe de Criação ao Planejamento

## Problema Identificado

A equipe de criação (perfil `supervisão_de_criação`) e outros membros da equipe Seven **não conseguem visualizar os empreendimentos** no dropdown do módulo de Planejamento.

### Análise Técnica

| Perfil | Empreendimentos Vinculados | Acesso Planejamento |
|--------|---------------------------|---------------------|
| Jéssica (Diretor Marketing) | 7 empreendimentos | ✅ Funciona |
| Jonas (Supervisão Criação) | 0 empreendimentos | ❌ Não vê dropdown |
| Kalebe (Supervisão Criação) | 0 empreendimentos | ❌ Não vê dropdown |
| Priscila (Supervisão Criação) | 0 empreendimentos | ❌ Não vê dropdown |
| Rafael (Supervisão Criação) | 0 empreendimentos | ❌ Não vê dropdown |

### Causa Raiz

A função `user_has_empreendimento_access()` que controla a RLS da tabela `empreendimentos` não reconhece a equipe Seven (exceto admins, gestores e corretores):

```sql
-- Função atual
SELECT 
  public.is_admin(_user_id) 
  OR public.has_role(_user_id, 'gestor_produto')
  OR public.has_role(_user_id, 'corretor')  -- ← Corretor tem acesso global
  OR EXISTS (SELECT 1 FROM user_empreendimentos WHERE user_id = _user_id AND ...)
-- ❌ Equipe Seven (marketing, supervisores) não está contemplada
```

### Fluxo Problemático

```text
Supervisão de Criação → Acessa /planejamento
       ↓
useEmpreendimentosSelect() → SELECT id, nome FROM empreendimentos
       ↓
RLS Policy: user_has_empreendimento_access(auth.uid(), id)
       ↓
Função retorna FALSE → Nenhum empreendimento visível
       ↓
Dropdown vazio → Usuário não consegue usar o módulo
```

## Solução Proposta

Atualizar a função `user_has_empreendimento_access()` para incluir a equipe Seven (funcionários internos), dando acesso de visualização a todos os empreendimentos ativos.

### Alteração da Função

```sql
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.has_role(_user_id, 'corretor')
    -- NOVO: Equipe Seven tem acesso de visualização a todos os empreendimentos
    OR public.is_seven_team(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
$function$;
```

### Justificativa

A função `is_seven_team()` já existe e identifica corretamente funcionários internos:

```sql
-- Retorna TRUE para qualquer role que NÃO seja:
-- 'incorporador', 'corretor', 'cliente_externo'
```

Isso significa que perfis como:
- `supervisão_de_criação` ✅
- `diretor_de_marketing` ✅  
- `gestor_produto` ✅
- Futuros perfis da equipe ✅

Terão acesso de visualização aos empreendimentos, alinhado com a política já existente em `planejamento_itens` que usa `is_seven_team()`.

## Impacto

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Equipe Criação ver empreendimentos | ❌ | ✅ |
| Política consistente com planejamento_itens | ❌ | ✅ |
| Incorporadores/Externos com acesso restrito | ✅ | ✅ (mantém) |

## Arquivos/Alterações

| Tipo | Alteração |
|------|-----------|
| Database Function | Atualizar `user_has_empreendimento_access()` para incluir `is_seven_team()` |

## Fluxo Corrigido

```text
Supervisão de Criação → Acessa /planejamento
       ↓
useEmpreendimentosSelect() → SELECT id, nome FROM empreendimentos
       ↓
RLS Policy: user_has_empreendimento_access(auth.uid(), id)
       ↓
is_seven_team() = TRUE → Função retorna TRUE
       ↓
Todos os empreendimentos visíveis → ✅ Dropdown populado
```
