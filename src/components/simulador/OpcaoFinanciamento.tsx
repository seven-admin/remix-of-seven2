import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ConfigFinanciamento, ResultadoFinanciamento } from '@/types/simulador.types';
import { formatarMoeda, formatarPercentual, parseDecimalInput } from '@/lib/calculoFinanciamento';

interface OpcaoFinanciamentoProps {
  config: ConfigFinanciamento;
  resultado: ResultadoFinanciamento | null;
  onChange: (config: ConfigFinanciamento) => void;
  valorLote: number;
}

export function OpcaoFinanciamento({
  config,
  resultado,
  onChange,
  valorLote,
}: OpcaoFinanciamentoProps) {
  const [entradaInput, setEntradaInput] = useState(config.percentualEntrada.toString().replace('.', ','));
  const [taxaInput, setTaxaInput] = useState(config.taxaJurosAnual.toString().replace('.', ','));

  useEffect(() => {
    setEntradaInput(config.percentualEntrada.toString().replace('.', ','));
  }, [config.percentualEntrada]);

  useEffect(() => {
    setTaxaInput(config.taxaJurosAnual.toString().replace('.', ','));
  }, [config.taxaJurosAnual]);

  const qtdBaloes = Math.floor(config.prazoMeses / 12);
  const totalBaloes = config.valorBalao * qtdBaloes;
  const baloesExcedidos = config.incluirBaloes && qtdBaloes > config.maxBaloes;

  return (
    <div className="space-y-4">
      {/* Configuração */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Linha 1: Entrada e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Percentual de Entrada (%)</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={entradaInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d.,]*$/.test(value)) {
                      setEntradaInput(value);
                      onChange({ ...config, percentualEntrada: parseDecimalInput(value) });
                    }
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prazo (meses)</Label>
              <Input
                type="number"
                min={12}
                max={360}
                step={12}
                value={config.prazoMeses}
                onChange={(e) =>
                  onChange({
                    ...config,
                    prazoMeses: parseInt(e.target.value) || 12,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Juros Anual (%)</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={taxaInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d.,]*$/.test(value)) {
                      setTaxaInput(value);
                      onChange({ ...config, taxaJurosAnual: parseDecimalInput(value) });
                    }
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  % a.a.
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Balões */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirBaloes"
                checked={config.incluirBaloes}
                onCheckedChange={(checked) =>
                  onChange({ ...config, incluirBaloes: !!checked })
                }
              />
              <Label htmlFor="incluirBaloes" className="cursor-pointer">
                Incluir Reforços Anuais (Balões)
              </Label>
            </div>

            {config.incluirBaloes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>Valor do Reforço Anual (R$)</Label>
                  <CurrencyInput
                    value={config.valorBalao}
                    onChange={(value) => onChange({ ...config, valorBalao: value })}
                  />
                  {qtdBaloes > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {qtdBaloes} balões = {formatarMoeda(totalBaloes)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Quantidade Máxima de Balões</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={config.maxBaloes}
                    onChange={(e) =>
                      onChange({ ...config, maxBaloes: parseInt(e.target.value) || 1 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Prazo atual: {qtdBaloes} balões ({config.prazoMeses / 12} anos)
                  </p>
                </div>
              </div>
            )}

            {baloesExcedidos && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Quantidade de balões ({qtdBaloes}) excede o limite máximo de {config.maxBaloes}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && resultado.valorOriginal > 0 && !baloesExcedidos && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="bg-amber-600">
                <Calculator className="h-3 w-3 mr-1" />
                Financiamento
              </Badge>
              <Badge variant="outline">Tabela Price</Badge>
              <Badge variant="outline">
                {formatarPercentual(resultado.taxaJurosMensal, 4)} a.m.
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Entrada</p>
                <p className="text-lg font-bold">
                  {formatarMoeda(resultado.valorEntrada)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({resultado.percentualEntrada}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Financiado</p>
                <p className="text-lg font-bold">
                  {formatarMoeda(resultado.saldoFinanciado)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parcela Mensal</p>
                <p className="text-lg font-bold">
                  {formatarMoeda(resultado.valorParcela)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resultado.prazoMeses}x
                </p>
              </div>
              {resultado.incluirBaloes && resultado.quantidadeBaloes > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Balões Anuais</p>
                  <p className="text-lg font-bold">
                    {formatarMoeda(resultado.valorBalao)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resultado.quantidadeBaloes}x
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Custo Efetivo Total
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatarMoeda(resultado.custoTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
