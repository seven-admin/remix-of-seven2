

# Plano: Correções de Layout no Portal do Incorporador

## Alterações Solicitadas

1. Remover o card "Seus Empreendimentos" (não tem função)
2. Remover o alerta "Dados em configuração"
3. Corrigir layout dos cards de navegação para terem tamanho uniforme

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` | Remover card e alerta |
| `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` | Corrigir altura uniforme dos cards |

---

## 1. Remover Card "Seus Empreendimentos" e Alerta

### `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

**Remover:**
- O bloco do Alert "Dados em configuração" (linhas 62-71)
- O card "Seus Empreendimentos" completo (linhas 127-188)
- Imports não utilizados: `Alert`, `AlertDescription`, `AlertTitle`, `AlertTriangle`, `Badge`, `User`, `Package`
- Variáveis não utilizadas: `hasUnidadesData`, `hasNegociacoesData`, `hasAnyData`, `gestorMap`, `loadingGestores`
- Hook não utilizado: `useGestoresMultiplosEmpreendimentos`

**Manter:**
- Os 4 KPIs principais (Empreendimentos, Unidades Disponíveis, VGV Vendido, Vendas do Mês)

---

## 2. Corrigir Layout Uniforme dos Cards de Navegação

### `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Problema atual:**
Os cards têm alturas diferentes porque o conteúdo interno varia (textos de descrição com 1 ou 2 linhas).

**Solução:**
Adicionar altura fixa ao conteúdo e garantir que o texto seja truncado:

```tsx
// Antes
<CardContent className="p-6 flex items-center gap-4">
  <div className="flex-1">
    <h3 className="font-semibold">Dashboard Executivo</h3>
    <p className="text-sm text-muted-foreground">KPIs e métricas detalhadas</p>
  </div>
</CardContent>

// Depois
<CardContent className="p-6 flex items-center gap-4 h-full">
  <div className="flex-1 min-w-0">
    <h3 className="font-semibold truncate">Dashboard Executivo</h3>
    <p className="text-sm text-muted-foreground line-clamp-1">KPIs e métricas detalhadas</p>
  </div>
</CardContent>
```

E no grid container, usar `grid-rows-1` para forçar altura uniforme:

```tsx
// Adicionar h-full no Card wrapper
<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
```

---

## Resultado Visual Esperado

Antes:
```text
┌───────────────────┐ ┌───────────────────┐ ┌─────────────────┐ ┌───────────────────┐
│ Dashboard         │ │ Forecast      →   │ │ Marketing   →   │ │ Planejamento      │
│ Executivo         │ │ Previsões e       │ │ Tickets de      │ │ Cronograma de     │
│ KPIs e métricas   │ │ atividades        │ │ criação         │ │ tarefas           │
│ detalhadas     →  │ └───────────────────┘ └─────────────────┘ │                →  │
└───────────────────┘                                           └───────────────────┘
     (mais alto)         (menor)                (menor)             (mais alto)
```

Depois:
```text
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ Dashboard         │ │ Forecast      →   │ │ Marketing     →   │ │ Planejamento  →   │
│ Executivo         │ │ Previsões e ativi │ │ Tickets de criação│ │ Cronograma de ... │
│ KPIs e métricas...│ │                   │ │                   │ │                   │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘
         (todos com altura uniforme)
```

---

## Código Final do Dashboard Simplificado

O `PortalIncorporadorDashboard.tsx` ficará apenas com os 4 KPIs, que já são renderizados na página principal abaixo dos cards de navegação.

