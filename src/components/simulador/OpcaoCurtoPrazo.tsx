import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { ConfigCurtoPrazo, ResultadoCurtoPrazo } from '@/types/simulador.types';
import { formatarMoeda, parseDecimalInput } from '@/lib/calculoFinanciamento';

interface OpcaoCurtoPrazoProps {
  config: ConfigCurtoPrazo;
  resultado: ResultadoCurtoPrazo | null;
  onChange: (config: ConfigCurtoPrazo) => void;
}

export function OpcaoCurtoPrazo({
  config,
  resultado,
  onChange,
}: OpcaoCurtoPrazoProps) {
  const [entradaInput, setEntradaInput] = useState(config.percentualEntrada.toString().replace('.', ','));

  useEffect(() => {
    setEntradaInput(config.percentualEntrada.toString().replace('.', ','));
  }, [config.percentualEntrada]);

  const handleEntradaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[\d.,]*$/.test(value)) {
      setEntradaInput(value);
      onChange({ ...config, percentualEntrada: parseDecimalInput(value) });
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuração */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Percentual de Entrada (%)</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={entradaInput}
                  onChange={handleEntradaChange}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantidade de Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                value={config.quantidadeParcelas}
                onChange={(e) =>
                  onChange({
                    ...config,
                    quantidadeParcelas: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Parcelamento sem juros - parcelas fixas
          </p>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && resultado.valorOriginal > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="bg-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Curto Prazo
              </Badge>
              <Badge variant="outline">Sem Juros</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Parcelas</p>
                <p className="text-lg font-bold">
                  {resultado.quantidadeParcelas}x
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Parcela</p>
                <p className="text-lg font-bold">
                  {formatarMoeda(resultado.valorParcela)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatarMoeda(resultado.totalPago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
