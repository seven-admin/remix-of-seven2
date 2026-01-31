
# Plano: Tornar WhatsApp Obrigatório no Cadastro de Corretores

## Resumo

Duas alterações simples no formulário de cadastro de corretores:
1. Renomear o campo de "Telefone/WhatsApp" para "WhatsApp"
2. Tornar o campo obrigatório (atualmente é opcional)

---

## Alterações no Arquivo

### Arquivo: `src/components/auth/CorretorRegisterForm.tsx`

### 1. Atualizar Schema de Validação (linha 72)

**Antes:**
```tsx
telefone: z.string().optional(),
```

**Depois:**
```tsx
telefone: z.string().min(14, 'WhatsApp é obrigatório'),
```

> O mínimo de 14 caracteres garante que o número está completo: `(00) 00000-0000`

---

### 2. Atualizar Label do Campo (linha 324)

**Antes:**
```tsx
<Label htmlFor="telefone">Telefone/WhatsApp</Label>
```

**Depois:**
```tsx
<Label htmlFor="telefone">WhatsApp *</Label>
```

---

### 3. Adicionar Exibição de Erro e Estilo de Borda (linhas 325-332)

**Antes:**
```tsx
<Input
  id="telefone"
  value={formData.telefone}
  onChange={(e) => handleChange('telefone', e.target.value)}
  placeholder="(00) 00000-0000"
  maxLength={15}
/>
```

**Depois:**
```tsx
<Input
  id="telefone"
  value={formData.telefone}
  onChange={(e) => handleChange('telefone', e.target.value)}
  placeholder="(00) 00000-0000"
  maxLength={15}
  className={errors.telefone ? 'border-destructive' : ''}
/>
{errors.telefone && (
  <p className="text-xs text-destructive">{errors.telefone}</p>
)}
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/auth/CorretorRegisterForm.tsx` | Alterar label e tornar campo obrigatório |

---

## Resultado Visual

O campo passará de:
```
Telefone/WhatsApp
[(00) 00000-0000        ]
```

Para:
```
WhatsApp *
[(00) 00000-0000        ]
⚠ WhatsApp é obrigatório (se não preenchido)
```
