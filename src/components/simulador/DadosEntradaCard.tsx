import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Banknote, Car, Home, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DadosEntrada } from '@/types/simulador.types';
import {
  FormaQuitacao,
  FORMA_QUITACAO_LABELS,
  FormaPagamento,
  FORMA_PAGAMENTO_LABELS,
} from '@/types/condicoesPagamento.types';

interface DadosEntradaCardProps {
  dados: DadosEntrada;
  onChange: (dados: DadosEntrada) => void;
}

const formasQuitacao: { value: FormaQuitacao; icon: React.ElementType }[] = [
  { value: 'dinheiro', icon: Banknote },
  { value: 'veiculo', icon: Car },
  { value: 'imovel', icon: Home },
  { value: 'outro_bem', icon: Package },
];

export function DadosEntradaCard({ dados, onChange }: DadosEntradaCardProps) {

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="h-5 w-5" />
          Entrada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forma de Quitação */}
        <div className="space-y-2">
          <Label>Forma de Quitação</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {formasQuitacao.map(({ value, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={dados.formaQuitacao === value ? 'default' : 'outline'}
                className={cn(
                  'h-auto py-3 flex flex-col items-center gap-1',
                  dados.formaQuitacao === value && 'ring-2 ring-primary'
                )}
                onClick={() => onChange({ ...dados, formaQuitacao: value })}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{FORMA_QUITACAO_LABELS[value]}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor da Entrada */}
          <div className="space-y-2">
            <Label>Valor da Entrada (R$)</Label>
            <CurrencyInput
              value={dados.valor}
              onChange={(value) => onChange({ ...dados, valor: value })}
              placeholder="0,00"
            />
          </div>

          {/* Forma de Pagamento (se dinheiro) */}
          {dados.formaQuitacao === 'dinheiro' && (
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={dados.formaPagamento || 'boleto'}
                onValueChange={(v) =>
                  onChange({ ...dados, formaPagamento: v as FormaPagamento })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGAMENTO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Campos do Bem (se não for dinheiro) */}
        {dados.formaQuitacao !== 'dinheiro' && (
          <div className="space-y-4 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">
              Dados do Bem em Dação
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descrição do Bem</Label>
                <Input
                  value={dados.bemDescricao || ''}
                  onChange={(e) =>
                    onChange({ ...dados, bemDescricao: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Avaliado (R$)</Label>
                <CurrencyInput
                  value={dados.bemValorAvaliado || 0}
                  onChange={(value) => onChange({ ...dados, bemValorAvaliado: value })}
                />
              </div>
            </div>

            {dados.formaQuitacao === 'veiculo' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={dados.bemMarca || ''}
                    onChange={(e) =>
                      onChange({ ...dados, bemMarca: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={dados.bemModelo || ''}
                    onChange={(e) =>
                      onChange({ ...dados, bemModelo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    value={dados.bemAno || ''}
                    onChange={(e) =>
                      onChange({ ...dados, bemAno: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input
                    value={dados.bemPlaca || ''}
                    onChange={(e) =>
                      onChange({ ...dados, bemPlaca: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
