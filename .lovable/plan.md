
# Plano: Correções no Módulo de Planejamento e Sidebar

## Problemas Identificados

1. **Página de Configurações sem Layout** - `PlanejamentoConfiguracoes.tsx` não usa o `MainLayout`, ficando sem a sidebar e estrutura padrão.

2. **Ordem incorreta no Sidebar** - O grupo "Planejamento" está após Marketing/Eventos, mas deveria aparecer logo após "Dashboard".

3. **Sidebar muito escura** - O background atual (`--sidebar-background: 0 0% 12%`) é um cinza muito escuro. Será ajustado para um tom mais claro.

---

## Alterações

### 1. PlanejamentoConfiguracoes.tsx
Envolver o conteúdo com `MainLayout`:

```tsx
import { MainLayout } from '@/components/layout/MainLayout';
// ...

export default function PlanejamentoConfiguracoes() {
  return (
    <MainLayout>
      <PageHeader ... />
      <div className="grid gap-6 ...">
        ...
      </div>
    </MainLayout>
  );
}
```

### 2. Sidebar.tsx - Reordenar Grupos
Mover o grupo "Planejamento" para a segunda posição (após Dashboard):

**Nova ordem:**
1. Dashboard
2. **Planejamento** (movido)
3. Empreendimentos
4. Clientes
5. Forecast
6. Comercial
7. ... (demais grupos)

### 3. index.css - Background da Sidebar Mais Claro
Alterar a variável CSS:

**Antes:**
```css
--sidebar-background: 0 0% 12%;  /* Cinza muito escuro */
--sidebar-accent: 0 0% 18%;
--sidebar-border: 0 0% 20%;
```

**Depois:**
```css
--sidebar-background: 0 0% 18%;  /* Cinza mais claro */
--sidebar-accent: 0 0% 24%;
--sidebar-border: 0 0% 26%;
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PlanejamentoConfiguracoes.tsx` | Envolver com `MainLayout` |
| `src/components/layout/Sidebar.tsx` | Reordenar grupo Planejamento para posição 2 |
| `src/index.css` | Ajustar cores da sidebar para tons mais claros |

---

## Resultado Esperado

- Página de configurações do planejamento exibirá a sidebar e layout padrão
- Planejamento aparecerá em posição de destaque no menu (após Dashboard)
- Sidebar com background mais claro e melhor contraste visual
