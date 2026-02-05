

# Plano: Adaptar Timeline Global ao Tamanho da Tela

## Problema Identificado

Na imagem enviada, a área de scroll da Timeline Global está muito pequena e não aproveita o espaço disponível na tela. O componente usa um `maxHeight: 600` fixo (linha 385), resultando em uma timeline "achatada" com muito espaço branco abaixo.

## Solução

Substituir a altura fixa por uma **altura dinâmica baseada no viewport** (`calc(100vh - X)`), fazendo com que a timeline preencha o espaço disponível na tela.

---

## Alterações Técnicas

### Arquivo: `src/components/planejamento/PlanejamentoGlobalTimeline.tsx`

#### Mudança principal (linha 385)

**De:**
```typescript
style={{ maxHeight: 600 }}
```

**Para:**
```typescript
style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}
```

**Cálculo do valor `320px`:**
- Header da página: ~64px
- Tabs superiores: ~48px
- Filtros: ~56px  
- CardHeader do componente: ~52px
- Margem de segurança: ~100px
- **Total aproximado: ~320px**

Isso permite que a timeline ocupe praticamente toda a altura restante da viewport.

---

## Detalhes da Implementação

```tsx
{/* Container principal com altura dinâmica */}
<div 
  ref={containerRef}
  className="border-t overflow-auto"
  style={{ 
    height: 'calc(100vh - 320px)',  // Preenche o espaço disponível
    minHeight: 400                   // Altura mínima para evitar colapso
  }}
>
```

---

## Benefícios

1. **Melhor aproveitamento da tela** - Timeline expande para ocupar o espaço disponível
2. **Scroll vertical proporcional** - Barra de scroll maior e mais fácil de usar
3. **Experiência consistente** - Segue padrão usado em outros componentes (Sidebar, KanbanColumn)
4. **Responsivo** - Adapta automaticamente a diferentes tamanhos de monitor

---

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Trocar `maxHeight: 600` por `height: 'calc(100vh - 320px)'` com `minHeight: 400` |

