import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { ConfigAVista, ResultadoAVista } from '@/types/simulador.types';
import { formatarMoeda, parseDecimalInput } from '@/lib/calculoFinanciamento';

interface OpcaoAVistaProps {
  config: ConfigAVista;
  resultado: ResultadoAVista | null;
  onChange: (config: ConfigAVista) => void;
}

export function OpcaoAVista({ config, resultado, onChange }: OpcaoAVistaProps) {
  const [descontoInput, setDescontoInput] = useState(config.percentualDesconto.toString().replace('.', ','));

  useEffect(() => {
    setDescontoInput(config.percentualDesconto.toString().replace('.', ','));
  }, [config.percentualDesconto]);

  const handleDescontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[\d.,]*$/.test(value)) {
      setDescontoInput(value);
      onChange({ percentualDesconto: parseDecimalInput(value) });
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuração */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Percentual de Desconto (%)</Label>
            <div className="relative max-w-xs">
              <Input
                type="text"
                value={descontoInput}
                onChange={handleDescontoChange}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Desconto aplicado no pagamento à vista
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && resultado.valorOriginal > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />À Vista
              </Badge>
              <Badge variant="outline">{config.percentualDesconto}% OFF</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Original</p>
                <p className="text-lg font-medium line-through text-muted-foreground">
                  {formatarMoeda(resultado.valorOriginal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desconto</p>
                <p className="text-lg font-medium text-green-600">
                  - {formatarMoeda(resultado.valorDesconto)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Final</p>
                <p className="text-2xl font-bold text-primary">
                  {formatarMoeda(resultado.valorFinal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
