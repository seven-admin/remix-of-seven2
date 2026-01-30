

# Plano: Refatoração do Portal do Incorporador - Marketing e Forecast

## Contexto

O usuário solicitou ajustes em duas páginas do Portal do Incorporador:

1. **Marketing** (`/portal-incorporador/marketing`): Simplificar layout, reduzir importância dos atrasados, manter apenas dois gráficos + lista de próximas entregas
2. **Forecast** (`/portal-incorporador/forecast`): Corrigir layout quebrado dos cards de "Novos Atendimentos" e "Retornos"

---

## Problemas Identificados

### Marketing
- Layout atual tem 4 KPIs + 2 gráficos + 2 listas (muito denso)
- Tickets atrasados têm muito destaque visual
- Gráfico "Por Categoria" mostra apenas badges (não é um gráfico visual)

### Forecast
- Componente `AtendimentosResumo` renderiza dois cards lado a lado dentro de um grid de 2 colunas
- Resultado: 2 cards que ocupam só metade da largura (quebrados visualmente)
- O grid pai já é `lg:grid-cols-2`, e o componente interno também é `md:grid-cols-2`

---

## 1. Refatoração do Marketing

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx`

**Novo layout simplificado:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Tickets Ativos: 7]  [Em Produção: 3]  [Concluídos: 2]  [⚠️ 2]│  <- KPIs compactos
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐ ┌─────────────────────────────────┐
│   Tickets por Etapa         │ │    Por Categoria                │
│   (donut chart)             │ │    (donut chart)                │
│                             │ │                                 │
│   ○ Briefing (2)            │ │    ○ Design Gráfico (3)         │
│   ○ Produção (3)            │ │    ○ Render 3D (2)              │
│   ○ Revisão (1)             │ │    ○ Vídeo (2)                  │
└─────────────────────────────┘ └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│   Próximas Entregas                                        [7]  │
│─────────────────────────────────────────────────────────────────│
│   MKT-042  |  Banner promocional       |  Design Gráfico  | 2d │
│   MKT-038  |  Vídeo institucional      |  Vídeo           | 4d │
│   MKT-045  |  Render fachada           |  Render 3D       | 7d │
└─────────────────────────────────────────────────────────────────┘
```

**Alterações:**
1. Manter os 4 KPIs compactos (já estão bons)
2. Card "Tickets Atrasados" (lista) → REMOVIDO (contador já está no KPI)
3. Card "Por Categoria" → Transformar em gráfico de donut (como o de Etapas)
4. Lista "Próximas Entregas" → Mover para baixo dos gráficos, ocupando largura total

---

## 2. Correção do Gráfico de Categorias

O gráfico atual mostra apenas badges com texto. Será convertido para um donut chart similar ao de Etapas.

**De:**
```tsx
<div className="space-y-3">
  {data.porCategoria.map((cat) => (
    <div key={cat.categoria} className="flex items-center justify-between">
      <span className="text-sm">{cat.label}</span>
      <Badge variant="outline">{cat.total}</Badge>
    </div>
  ))}
</div>
```

**Para:**
```tsx
{data.porCategoria.length === 0 ? (
  <p className="text-center text-muted-foreground py-8">Sem dados</p>
) : (
  <>
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={porCategoriaChart}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {porCategoriaChart.map((entry, index) => (
            <Cell key={`cell-cat-${index}`} fill={CATEGORIA_COLORS[index % CATEGORIA_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {porCategoriaChart.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORIA_COLORS[index % CATEGORIA_COLORS.length] }} />
          <span className="text-muted-foreground">{item.name} ({item.value})</span>
        </div>
      ))}
    </div>
  </>
)}
```

---

## 3. Correção do Forecast - Atendimentos

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

**Problema atual (linha 169-171):**
```tsx
<div className="grid gap-4 lg:grid-cols-2">
  <AtendimentosResumo empreendimentoIds={empreendimentoIds} />
</div>
```

O componente `AtendimentosResumo` já retorna um grid com 2 cards. Quando colocado dentro de outro grid de 2 colunas, fica deslocado.

**Solução:** Usar `lg:col-span-2` ou remover o wrapper:

```tsx
{/* Atendimentos - ocupa largura total */}
<AtendimentosResumo empreendimentoIds={empreendimentoIds} />
```

Assim o componente interno gerencia seu próprio layout corretamente.

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx` | Simplificar layout, gráfico de categorias |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Corrigir wrapper do AtendimentosResumo |

---

## Resultado Visual Esperado

### Marketing (Novo Layout)
```text
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Ativos  │ │Em Prod. │ │Concluíd.│ │Atrasados│  <- 4 KPIs
│   7     │ │   3     │ │   2     │ │   2     │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────────────┐ ┌─────────────────┐
│ Por Etapa       │ │ Por Categoria   │  <- 2 Donuts
│    [DONUT]      │ │    [DONUT]      │
│ ● Briefing  (2) │ │ ● Design    (3) │
│ ● Produção  (3) │ │ ● Render    (2) │
└─────────────────┘ └─────────────────┘

┌─────────────────────────────────────┐
│ Próximas Entregas (7 dias)      [4] │  <- Lista completa
│ ─────────────────────────────────── │
│ MKT-042  Banner promo    Design  2d │
│ MKT-038  Vídeo inst.     Vídeo   4d │
└─────────────────────────────────────┘
```

### Forecast (Atendimentos Corrigidos)
```text
┌─────────────────────┐ ┌─────────────────────┐
│ Novos Atendimentos  │ │ Retornos            │
│        0            │ │        0            │
│ ████████████░░ 0%   │ │ ████████████░░ 0%   │
│ Pend: 0 • Conc: 0   │ │ Pend: 0 • Conc: 0   │
└─────────────────────┘ └─────────────────────┘
      (ocupam a largura total corretamente)
```

---

## Detalhes Técnicos

### Cores para Categorias
```tsx
const CATEGORIA_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];
```

### Preparação de Dados para o Gráfico
```tsx
// Converter porCategoria para formato do gráfico
const porCategoriaChart = data.porCategoria.map(cat => ({
  name: cat.label,
  value: cat.total,
}));
```

