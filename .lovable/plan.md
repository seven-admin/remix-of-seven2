
# Plano: Adicionar Cabecalho com Logo ao PDF de Unidades Disponiveis

## O que sera feito

Adicionar um cabecalho profissional no topo do PDF exportado, contendo:

1. Logo do sistema (imagem `src/assets/logo.png`)
2. Textos centralizados:
   - **CRM 360** (destaque principal)
   - **Seven Group 360**
   - **Plataforma de Gestao Integrada**
3. Separador visual antes da tabela

O cabecalho ficara acima do titulo "Unidades Disponiveis - [Empreendimento]" que ja existe.

## Arquivo a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/empreendimentos/UnidadesTab.tsx` | Adicionar import do logo e inserir bloco HTML do cabecalho no `htmlContent` |

## Detalhes tecnicos

1. **Importar** o logo: `import logo from '@/assets/logo.png'` (mesmo padrao usado em Sidebar, LoginForm, etc.)
2. **Inserir** bloco HTML no inicio do `htmlContent` (linha 199), antes do `<h2>` existente:
   - Imagem do logo centralizada (altura ~50px)
   - Texto "CRM 360" em negrito, 18pt
   - Texto "Seven Group 360" em 14pt
   - Texto "Plataforma de Gestao Integrada" em 10pt, cor cinza
   - Linha separadora (`<hr>`) com margem inferior de 20px
3. A propriedade `useCORS: true` ja esta configurada no `html2canvas`, garantindo que a imagem do logo sera renderizada corretamente no PDF

## Layout do cabecalho

```text
+------------------------------------------+
|              [LOGO 50px]                 |
|              CRM 360                     |
|          Seven Group 360                 |
|   Plataforma de Gestao Integrada         |
|------------------------------------------|
|  Unidades Disponiveis - LIVTY            |
|  Gerado em 07/02/2026                    |
|  ... tabela ...                          |
+------------------------------------------+
```

Nenhum arquivo novo sera criado. Apenas uma alteracao pontual no HTML gerado dentro da funcao `handleExportarDisponiveis`.
