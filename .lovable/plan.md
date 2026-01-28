

# Plano de Correção: Redirecionamento Incorreto para Incorporadores

## Problema Identificado

O usuário com role `incorporador` está sendo redirecionado para `/mapa-unidades` em vez de `/portal-incorporador` após o login.

### Causa Raiz

Existem **dois problemas** no código atual:

1. **`Index.tsx` (linha 24-26)**: Renderiza `DashboardIncorporador` (dashboard antigo com layout do sistema) quando `role === 'incorporador'`, ao invés de redirecionar para o novo portal.

2. **Conflito de lógica**: O `useDefaultRoute.ts` retorna `/portal-incorporador` para incorporadores, mas o `Index.tsx` nunca chega a usar esse valor porque retorna antes com `<DashboardIncorporador />`.

### Por que foi para `/mapa-unidades`?

Com base nos dados da sessão, o incorporador tem as seguintes permissões com `can_view: true`:
- `dashboard` (rota `/`)
- `portal_incorporador` (rota `/portal-incorporador`)
- `unidades` (rota `/mapa-unidades`)
- `relatorios`, `reservas`, `briefings`

Se houver uma race condition onde o `role` não está carregado no momento da verificação inicial, o código cai no loop de `routePriority` e encontra `unidades` com permissão, redirecionando para `/mapa-unidades`.

---

## Solução

### Alteração 1: Corrigir `Index.tsx`

Modificar o `Index.tsx` para redirecionar incorporadores para `/portal-incorporador` ao invés de renderizar `DashboardIncorporador`:

```typescript
// Antes (linhas 24-26):
if (role === 'incorporador') {
  return <DashboardIncorporador />;
}

// Depois:
if (role === 'incorporador') {
  return <Navigate to="/portal-incorporador" replace />;
}
```

### Alteração 2: Adicionar módulo `unidades` ao `routePriority` (opcional mas recomendado)

Para evitar confusão futura, garantir que o `routePriority` inclua `/mapa-unidades`:

```typescript
const routePriority = [
  { path: '/', module: 'dashboard' },
  { path: '/portal-incorporador', module: 'portal_incorporador' },
  { path: '/marketing', module: 'projetos_marketing' },
  { path: '/mapa-unidades', module: 'unidades' }, // Adicionar
  { path: '/empreendimentos', module: 'empreendimentos' },
  // ...
];
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/Index.tsx` | Trocar `<DashboardIncorporador />` por `<Navigate to="/portal-incorporador" replace />` para role `incorporador` |
| `src/hooks/useDefaultRoute.ts` | (Opcional) Adicionar `/mapa-unidades` ao `routePriority` para consistência |

---

## Critérios de Aceite

1. Usuário com role `incorporador` é redirecionado para `/portal-incorporador` após login
2. O Portal do Incorporador é exibido com o layout próprio (`PortalIncorporadorLayout`)
3. Não há mais acesso ao `DashboardIncorporador` antigo pelo fluxo normal
4. O menu do portal mostra apenas: Dashboard, Executivo, Forecast, Marketing

---

## Próximo Passo Após Correção

Testar o fluxo de login com o usuário `mail@mail.com` para confirmar:
1. Login redireciona para `/portal-incorporador`
2. Portal exibe corretamente os dados dos empreendimentos vinculados
3. Navegação entre páginas do portal funciona

