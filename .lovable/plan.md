

# Plano: Corrigir Erro de SelectItem e Remover Botão Config Redundante

## Problema 1: Erro do Select.Item

O erro ocorre porque componentes `SelectItem` do Radix UI **não permitem valor vazio** (`value=""`). Existem duas ocorrências no arquivo `ImportarPlanejamentoDialog.tsx`:

- **Linha 507**: `<SelectItem value="">Não mapear</SelectItem>` (mapeamento de colunas)
- **Linha 627**: `<SelectItem value="">Não atribuir</SelectItem>` (mapeamento de responsáveis)

### Solução

Substituir `value=""` por um valor especial como `value="__none__"` e tratar esse valor especialmente na lógica de onChange.

**Alterações em `src/components/planejamento/ImportarPlanejamentoDialog.tsx`:**

1. Mudar `<SelectItem value="">Não mapear</SelectItem>` para `<SelectItem value="__none__">Não mapear</SelectItem>`
2. Mudar `<SelectItem value="">Não atribuir</SelectItem>` para `<SelectItem value="__none__">Não atribuir</SelectItem>`
3. Ajustar os handlers de `onValueChange` para converter `"__none__"` para `""`

---

## Problema 2: Botão Config Redundante

O botão "Config" na página `/planejamento` é redundante porque já existe um item no sidebar:

**Sidebar.tsx (linhas 79-82):**
```tsx
{
  label: 'Planejamento',
  items: [
    { icon: ClipboardList, label: 'Cronograma', path: '/planejamento', ... },
    { icon: Settings, label: 'Configurações', path: '/planejamento/configuracoes', ... }, // JÁ EXISTE!
  ],
}
```

### Solução

Remover o botão "Config" do arquivo `src/pages/Planejamento.tsx`.

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planejamento/ImportarPlanejamentoDialog.tsx` | Corrigir SelectItem com value vazio |
| `src/pages/Planejamento.tsx` | Remover botão Config redundante |

---

## Alterações Detalhadas

### 1. ImportarPlanejamentoDialog.tsx

**Linha 507 - Mapeamento de Colunas:**
```tsx
// De:
<SelectItem value="">Não mapear</SelectItem>

// Para:
<SelectItem value="__none__">Não mapear</SelectItem>
```

**Handler correspondente (linha 499-501):**
```tsx
// De:
onValueChange={(value) =>
  setColumnMapping((prev) => ({ ...prev, [key]: value }))
}

// Para:
onValueChange={(value) =>
  setColumnMapping((prev) => ({ ...prev, [key]: value === '__none__' ? '' : value }))
}
```

**Linha 627 - Mapeamento de Responsáveis:**
```tsx
// De:
<SelectItem value="">Não atribuir</SelectItem>

// Para:
<SelectItem value="__none__">Não atribuir</SelectItem>
```

**Handler correspondente (linha 616-620):**
```tsx
// De:
onValueChange={(id) =>
  setValueMapping((prev) => ({
    ...prev,
    responsaveis: { ...prev.responsaveis, [value]: id },
  }))
}

// Para:
onValueChange={(id) =>
  setValueMapping((prev) => ({
    ...prev,
    responsaveis: { ...prev.responsaveis, [value]: id === '__none__' ? '' : id },
  }))
}
```

### 2. Planejamento.tsx

**Remover o botão Config (linhas 51-55):**
```tsx
// Remover este bloco:
<Button variant="outline" size="sm" asChild>
  <a href="/planejamento/configuracoes">
    <Settings className="h-4 w-4 mr-2" />
    Config
  </a>
</Button>
```

**Remover import não utilizado:**
```tsx
// Remover 'Settings' do import de lucide-react se não for mais usado
```

---

## Resultado Esperado

1. O erro de `Select.Item` não ocorrerá mais ao anexar arquivos
2. O fluxo de importação funcionará corretamente com opções "Não mapear" e "Não atribuir"
3. A interface ficará mais limpa sem o botão Config redundante
4. Usuários continuam tendo acesso às configurações via sidebar

