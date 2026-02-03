
Objetivo
- Eliminar definitivamente o erro “RangeError: Invalid time value” ao acessar `/forecast`.

Diagnóstico (com base nos logs + código atual)
- O erro ainda está vindo do componente `AlertasFollowup`.
- No diff mais recente, nós trocamos `new Date(\`\${dataRef}T00:00:00\`)` por `parseLocalDate(dataRef)`.
- Porém, os dados de `data_followup` que vêm do Supabase não são “YYYY-MM-DD”; eles vêm como timestamp ISO, por exemplo:
  - `"2026-01-16T04:00:00+00:00"`
- A função atual:
  - `parseLocalDate(dateStr: string)` faz `dateStr.split('-')` e tenta converter o “dia” para Number.
  - Quando `dateStr` contém `T04:00:00+00:00`, o “day” vira algo como `"16T04:00:00+00:00"`, que resulta em `NaN`.
  - Isso gera `new Date(year, month - 1, NaN)` => `Invalid Date`.
  - `formatDistanceToNow(Invalid Date)` lança “Invalid time value”.

Solução (ajuste robusto de parsing + validação)
1) Corrigir o helper de data para aceitar:
   - `YYYY-MM-DD`
   - ISO timestamp (`YYYY-MM-DDTHH:mm:ss...`)
   - (e rejeitar qualquer coisa inválida sem quebrar a tela)

2) Trocar o fluxo para:
   - Normalizar a string (pegar apenas os primeiros 10 caracteres quando houver “T”).
   - Validar se ano/mês/dia são números válidos.
   - Validar se o Date final é válido (getTime não pode ser NaN).
   - Se inválido, retornar `null` e renderizar um fallback (“Data não informada” / “Data inválida”).

3) Fortalecer o filtro e o sort:
   - Hoje o filtro apenas verifica `dataRef != null`, mas isso não basta (pode ser string inválida).
   - Vamos filtrar com base no parse (só entra alerta com data parseável).
   - E no sort, vamos ordenar usando o Date parseado (evita `new Date(string)` em formato imprevisível).

Mudanças detalhadas (arquivo)
Arquivo: `src/components/forecast/AlertasFollowup.tsx`

A) Substituir `parseLocalDate` por uma versão segura
- Assinatura sugerida:
  - `const parseLocalDate = (dateStr: string | null | undefined): Date | null => { ... }`
- Regras:
  - Se `!dateStr`, retorna `null`
  - `const normalized = dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr`
  - Split `normalized` em `YYYY-MM-DD`
  - Se year/month/day inválidos => `null`
  - Criar `new Date(year, month-1, day)` e checar `isNaN(d.getTime())` => `null` se inválido

B) Atualizar a montagem de `alertas`
- Em vez de filtrar só por `dataRef != null`, filtrar por `parseLocalDate(dataRef) != null`.
- Para não recalcular parse várias vezes, opção simples:
  - No `.map`, anexar `dataRef` e/ou `dataParsed` ao objeto (ex.: `data_ref`, `data_ref_parsed`)
  - Filtrar por `data_ref_parsed`
  - Ordenar por `data_ref_parsed.getTime()`

C) Atualizar a renderização do “atraso”
- Usar a data parseada:
  - se `dataParsed` existir, `formatDistanceToNow(dataParsed, ...)`
  - senão, fallback (“Data não informada” ou “Data inválida”)

Casos de teste (o que validar no browser)
1) Abrir `/forecast` com dados que tenham `data_followup` no formato ISO (com hora/timezone).
   - Esperado: não quebrar; mostrar atraso corretamente.
2) Alertas “vencida” (usa `data_fim` que geralmente é `YYYY-MM-DD`).
   - Esperado: também OK.
3) Registros com `data_fim` ou `data_followup` nulos (ou strings vazias).
   - Esperado: não quebrar; registro pode sumir da lista (se decidirmos filtrar) ou aparecer com “Data não informada”.
4) Verificar a ordenação dos alertas (mais antigos no topo).
5) Testar clique nos botões “Nova Atividade / Dispensar / Concluir” para garantir que a lista ainda funciona sem side effects.

Observação importante
- O log do console que você colou ainda referencia `AlertasFollowup.tsx?...:209`, o que pode ser de build cache, mas como a raiz é a mesma (date-fns recebendo Date inválida), esse ajuste resolve o “último buraco” do parsing.

Entrega
- 1 arquivo alterado: `src/components/forecast/AlertasFollowup.tsx`
- Nenhuma mudança de banco necessária.

Risco / impacto
- Baixo risco: mudanças localizadas, com fallback seguro.
- Impacto positivo: page `/forecast` não cai mais no ErrorBoundary por datas inconsistentes vindas do banco.
