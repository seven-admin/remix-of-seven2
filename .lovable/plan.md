

# Plano: Atualização de Valores das Unidades - Reserva do Lago

## Resumo da Importação

| Item | Valor |
|------|-------|
| Empreendimento | Reserva do Lago |
| ID | `13fc62b0-c926-48de-8a53-2c63efcdfdc0` |
| Total de unidades no banco | 406 |
| Total de registros no CSV | 406 |
| Campo a atualizar | `valor` |
| Chave de identificação | Quadra (bloco) + Lote (unidade) |

---

## Mapeamento de Dados

**Conversão necessária:**
- CSV `quadra: 1` → Banco `bloco_nome: "01"` (adicionar zero à esquerda)
- CSV `unidade: 1` → Banco `numero: "01"` (adicionar zero à esquerda)
- CSV `valor: 1114947,06` → Banco `valor: 1114947.06` (trocar vírgula por ponto)

---

## Exemplos de Atualização

| Quadra | Lote | Valor CSV | Valor Banco (atual) | Novo Valor |
|--------|------|-----------|---------------------|------------|
| 1 | 1 | 1114947,06 | 1100.00 | 1114947.06 |
| 1 | 2 | 700376,47 | 1000.00 | 700376.47 |
| 2 | 1 | 494426,47 | 1050.00 | 494426.47 |
| 20 | 5 | 685752,94 | (último) | 685752.94 |

---

## Processo de Execução

Serão gerados comandos SQL de UPDATE para cada unidade:

```sql
UPDATE unidades 
SET valor = 1114947.06, updated_at = NOW()
WHERE id = '368844ee-2fe9-428c-8c2b-132a191c62f0';
```

Para garantir a integridade, a atualização será feita:
1. Buscando o ID de cada unidade pelo match de bloco + número
2. Atualizando apenas o campo `valor`
3. Atualizando o timestamp `updated_at`

---

## Detalhes Técnicos

Como são 406 registros, a atualização será dividida em lotes menores para evitar timeout.

A query de match será:
```sql
SELECT u.id
FROM unidades u
JOIN blocos b ON u.bloco_id = b.id
WHERE b.nome = LPAD('1', 2, '0')  -- '01'
  AND u.numero = LPAD('1', 2, '0') -- '01'
  AND u.empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
```

---

## Próximos Passos

Após sua aprovação, executarei as atualizações em lotes usando o sistema de INSERT/UPDATE do Supabase, garantindo que cada unidade seja atualizada corretamente pelo match de Quadra + Lote.

