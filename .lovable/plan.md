

# Plano: Alterar Raio de Todos os Marcadores em Lote

## Objetivo

Adicionar uma funcionalidade para redimensionar todos os marcadores do mapa de uma vez, alterando o raio em lote.

## Contexto Atual

- Ja existe um campo de raio individual que aparece ao selecionar um marcador (linhas 1116-1128)
- Ja existe um campo de raio para novos marcadores ao desenhar (linhas 1034-1047)
- A funcao `handleUpdateSelectedRadius` atualiza o raio de um unico item selecionado

## Solucao

Adicionar um controle de "Raio em Lote" na toolbar, proximo ao botao "Limpar", que permite definir um novo raio e aplica-lo a todos os marcadores existentes no mapa.

### Alteracoes no arquivo `src/components/mapa/MapaEditor.tsx`

**1. Novo estado para controlar o dialog de raio em lote:**

```typescript
const [showBatchRadiusDialog, setShowBatchRadiusDialog] = useState(false);
const [batchRadius, setBatchRadius] = useState(15);
```

**2. Nova funcao `handleBatchRadius`:**

Atualiza o campo `raio` de todos os itens do tipo `marker` no estado `drawnItems`.

```typescript
const handleBatchRadius = (newRadius: number) => {
  setDrawnItems(prev => prev.map(item =>
    item.tipo === 'marker' ? { ...item, raio: newRadius } : item
  ));
  setShowBatchRadiusDialog(false);
  toast.success(`Raio de ${markerCount} marcador(es) atualizado para ${newRadius}`);
};
```

**3. Botao na toolbar (junto ao "Limpar"):**

Exibir um botao "Redimensionar" quando houver marcadores no mapa. Ao clicar, abre um dialog simples com:
- Input numerico para o novo raio (min: 5, max: 50)
- Indicacao de quantos marcadores serao afetados
- Botoes Cancelar e Aplicar

**4. Dialog de confirmacao:**

Dialog simples com preview do novo tamanho e contagem de marcadores que serao afetados.

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/mapa/MapaEditor.tsx` | Adicionar estado, funcao e UI para redimensionamento em lote |

Nenhum arquivo novo. Nenhuma alteracao no banco de dados. As mudancas sao aplicadas no estado local e so sao persistidas ao clicar "Salvar" (como funciona atualmente com o "Limpar").

## Fluxo do Usuario

```text
1. Abre o editor de mapa
2. Clica no botao "Redimensionar" na toolbar
3. Dialog abre mostrando quantos marcadores serao afetados
4. Define o novo raio (ex: 20)
5. Clica em "Aplicar"
6. Todos os marcadores sao redimensionados visualmente
7. Clica em "Salvar" para persistir as alteracoes
```
