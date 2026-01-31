
# Plano: Separar Corretores da Lista de Usuários

## Problema

Na gestão de usuários, a aba "Usuários" exibe **todos** os usuários do sistema, incluindo corretores. Isso gera duplicação, pois os corretores também aparecem na aba "Corretores".

**Esperado**: Corretores devem aparecer **apenas** na aba "Corretores", nunca na aba "Usuários".

---

## Solução

Modificar o filtro de usuários em `src/pages/Usuarios.tsx` para excluir automaticamente os usuários que possuem o role `corretor`.

---

## Alteração Necessária

### Arquivo: `src/pages/Usuarios.tsx`

Modificar o `filteredUsers` (useMemo) para excluir usuários com role = 'corretor':

```typescript
// ANTES (linha ~339-350)
const filteredUsers = useMemo(() => {
  let result = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (showOnlyPendentes) {
    result = result.filter(user => !user.is_active);
  }
  
  return result;
}, [users, searchTerm, showOnlyPendentes]);

// DEPOIS
const filteredUsers = useMemo(() => {
  // Excluir corretores - eles aparecem na aba Corretores
  let result = users.filter(user => user.role !== 'corretor');
  
  // Filtro de busca
  result = result.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (showOnlyPendentes) {
    result = result.filter(user => !user.is_active);
  }
  
  return result;
}, [users, searchTerm, showOnlyPendentes]);
```

### Ajustar Stats Cards

Os cards de estatísticas também devem ser atualizados para refletir apenas os usuários não-corretores:

```typescript
// Total de Usuários - excluir corretores
{users.filter(u => u.role !== 'corretor').length}

// Usuários Ativos - excluir corretores
{users.filter(u => u.is_active && u.role !== 'corretor').length}

// Usuários Inativos - excluir corretores
{users.filter(u => !u.is_active && u.role !== 'corretor').length}

// Pendentes count para badge
const pendentesCount = useMemo(() => 
  users.filter(u => !u.is_active && u.role !== 'corretor').length
, [users]);
```

---

## Resultado Final

| Aba | Exibe |
|-----|-------|
| **Usuários** | Admin, Super Admin, Gestor de Produto, Incorporador, Equipe Marketing, etc. (todos exceto corretor) |
| **Corretores** | Apenas usuários com role `corretor` |

---

## Impacto

- Nenhuma alteração no banco de dados
- Nenhuma alteração no backend
- Apenas filtro no frontend
- Os corretores continuam existindo, apenas não aparecem na aba errada
