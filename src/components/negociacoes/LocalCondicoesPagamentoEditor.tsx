import { useMemo, useState } from 'react';
import { Plus, Trash2, Settings2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toCents, fromCents } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { CondicaoPagamentoForm } from '@/components/contratos/CondicaoPagamentoForm';
import {
  TIPOS_PARCELA,
  TIPO_PARCELA_LABELS,
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  DEFAULT_CONDICAO_PAGAMENTO,
  type CondicaoPagamentoFormData,
  type TipoParcelaCodigo,
  type FormaPagamento,
} from '@/types/condicoesPagamento.types';
import { cn } from '@/lib/utils';

// Interface para condição local (sem ID, pois ainda não está salva)
export interface LocalCondicao extends CondicaoPagamentoFormData {
  _localId: string; // ID temporário para controle local
}

interface LocalCondicoesPagamentoEditorProps {
  valorReferencia: number;
  condicoes: LocalCondicao[];
  onChange: (condicoes: LocalCondicao[]) => void;
  readonly?: boolean;
}

export function LocalCondicoesPagamentoEditor({
  valorReferencia,
  condicoes,
  onChange,
  readonly = false,
}: LocalCondicoesPagamentoEditorProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState<string | null>(null);
  const [advancedFormOpen, setAdvancedFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrencyInput = (value: string): number => {
    const numericValue = value.replace(/\D/g, '');
    return Number(numericValue) / 100;
  };

  // Calculate totals
  const { totalConfigurado, percentualConfigurado, diferenca, diferencaCents } = useMemo(() => {
    let totalCents = 0;
    const valorRefCents = toCents(valorReferencia);
    
    condicoes.forEach(c => {
      const valorCents = toCents(c.valor || 0);
      totalCents += c.quantidade * valorCents;
    });
    
    const percentual = valorRefCents > 0 ? Math.min((totalCents / valorRefCents) * 100, 100) : 0;
    const diffCents = valorRefCents - totalCents;
    
    return { 
      totalConfigurado: fromCents(totalCents), 
      percentualConfigurado: percentual, 
      diferenca: fromCents(diffCents),
      diferencaCents: diffCents,
    };
  }, [condicoes, valorReferencia]);

  const isCentsDifference = Math.abs(diferencaCents) > 0 && Math.abs(diferencaCents) <= 100;

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddNewCondition = () => {
    const newCondition: LocalCondicao = {
      ...DEFAULT_CONDICAO_PAGAMENTO,
      _localId: generateLocalId(),
      tipo_parcela_codigo: 'mensal_serie',
      quantidade: 0,
      valor: 0,
    };
    onChange([...condicoes, newCondition]);
  };

  const handleFieldChange = (index: number, field: keyof LocalCondicao, value: unknown) => {
    const updated = [...condicoes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleQuantidadeChange = (index: number, value: string) => {
    const qtd = parseInt(value) || 0;
    handleFieldChange(index, 'quantidade', qtd);
  };

  const handleValorChange = (index: number, value: string) => {
    const valor = parseCurrencyInput(value);
    handleFieldChange(index, 'valor', valor);
  };

  const handleDelete = (localId: string) => {
    setConditionToDelete(localId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conditionToDelete) {
      const updated = condicoes.filter(c => c._localId !== conditionToDelete);
      onChange(updated);
      setConditionToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const openAdvancedForm = (index?: number) => {
    setEditingIndex(index !== undefined ? index : null);
    setAdvancedFormOpen(true);
  };

  const handleAdvancedSave = (data: CondicaoPagamentoFormData) => {
    if (editingIndex !== null && editingIndex < condicoes.length) {
      // Editing existing
      const updated = [...condicoes];
      updated[editingIndex] = { ...data, _localId: condicoes[editingIndex]._localId };
      onChange(updated);
    } else {
      // Creating new
      const newCondition: LocalCondicao = {
        ...data,
        _localId: generateLocalId(),
      };
      onChange([...condicoes, newCondition]);
    }
    setAdvancedFormOpen(false);
    setEditingIndex(null);
  };

  if (valorReferencia <= 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Defina o valor total da proposta para configurar as condições de pagamento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Valor da Proposta: {formatCurrency(valorReferencia)}</span>
          <span className={cn(
            "font-semibold",
            percentualConfigurado >= 100 ? "text-green-600" : 
            percentualConfigurado >= 50 ? "text-amber-600" : "text-muted-foreground"
          )}>
            {percentualConfigurado.toFixed(1)}% configurado
          </span>
        </div>
        <Progress 
          value={percentualConfigurado} 
          className={cn("h-3", percentualConfigurado >= 100 && "[&>div]:bg-green-600")} 
        />
      </div>

      {/* Alerta de diferença de valores */}
      {diferencaCents !== 0 && (
        <Alert variant={isCentsDifference ? "default" : "destructive"} className={cn("border-2", isCentsDifference && "border-amber-300 bg-amber-50 dark:bg-amber-950/20")}>
          <AlertTriangle className={cn("h-5 w-5", isCentsDifference && "text-amber-600")} />
          <AlertTitle className={cn("font-semibold", isCentsDifference && "text-amber-800 dark:text-amber-200")}>
            {isCentsDifference ? 'Ajuste de centavos necessário' : 'Condições de pagamento inconsistentes'}
          </AlertTitle>
          <AlertDescription className={cn("mt-1", isCentsDifference && "text-amber-700 dark:text-amber-300")}>
            {diferenca > 0 ? (
              <>
                Faltam <strong>{formatCurrency(Math.abs(diferenca))}</strong> para completar o valor total.
              </>
            ) : (
              <>
                O total configurado excede o valor da proposta em <strong>{formatCurrency(Math.abs(diferenca))}</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de condições */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">Tipo</TableHead>
              <TableHead className="w-[80px] text-center">Qtd</TableHead>
              <TableHead className="w-[140px]">Valor Unit.</TableHead>
              <TableHead className="w-[130px]">Forma</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {condicoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm">Nenhuma condição de pagamento configurada</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddNewCondition}
                      disabled={readonly}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar condição
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              condicoes.map((condition, index) => {
                const total = (condition.quantidade || 0) * (condition.valor || 0);
                
                return (
                  <TableRow key={condition._localId}>
                    <TableCell>
                      <Select
                        value={condition.tipo_parcela_codigo}
                        onValueChange={(v) => handleFieldChange(index, 'tipo_parcela_codigo', v)}
                        disabled={readonly}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PARCELA.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>
                              {TIPO_PARCELA_LABELS[tipo]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={condition.quantidade || ''}
                        onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                        className="h-8 text-xs text-center w-16"
                        disabled={readonly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={condition.valor ? formatCurrency(condition.valor) : ''}
                        onChange={(e) => handleValorChange(index, e.target.value)}
                        className="h-8 text-xs"
                        placeholder="R$ 0,00"
                        disabled={readonly}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={condition.forma_pagamento}
                        onValueChange={(v) => handleFieldChange(index, 'forma_pagamento', v as FormaPagamento)}
                        disabled={readonly}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS_PAGAMENTO.map(forma => (
                            <SelectItem key={forma} value={forma}>
                              {FORMA_PAGAMENTO_LABELS[forma]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {formatCurrency(total)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openAdvancedForm(index)}
                                disabled={readonly}
                              >
                                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Configurações avançadas</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(condition._localId)}
                                disabled={readonly}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Botões de ação */}
      {!readonly && condicoes.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddNewCondition}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openAdvancedForm()}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Avançado
          </Button>
        </div>
      )}

      {/* Resumo */}
      {condicoes.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Total configurado:</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold",
              diferencaCents === 0 ? "text-green-600" : "text-amber-600"
            )}>
              {formatCurrency(totalConfigurado)}
            </span>
            {diferencaCents === 0 && (
              <Badge variant="default" className="bg-green-600">
                ✓ 100%
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover condição de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulário avançado */}
      <CondicaoPagamentoForm
        open={advancedFormOpen}
        onOpenChange={setAdvancedFormOpen}
        onSave={handleAdvancedSave}
        initialData={editingIndex !== null && editingIndex < condicoes.length ? condicoes[editingIndex] : undefined}
      />
    </div>
  );
}
