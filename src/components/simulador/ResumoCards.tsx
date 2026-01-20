import { Card, CardContent } from '@/components/ui/card';
import { Banknote, CreditCard, Calendar, Wallet } from 'lucide-react';
import { ResultadoSimulacao } from '@/types/simulador.types';
import { formatarMoeda } from '@/lib/calculoFinanciamento';

interface ResumoCardsProps {
  resultado: ResultadoSimulacao | null;
  valorEntradaDigitado: number;
}

export function ResumoCards({ resultado, valorEntradaDigitado }: ResumoCardsProps) {
  if (!resultado) return null;

  const getValorEntrada = () => {
    if (resultado.tipo === 'avista') return valorEntradaDigitado;
    if (resultado.tipo === 'curto') return resultado.valorEntrada;
    if (resultado.tipo === 'financiamento') return resultado.valorEntrada;
    return 0;
  };

  const getValorParcela = () => {
    if (resultado.tipo === 'avista') return 0;
    if (resultado.tipo === 'curto') return resultado.valorParcela;
    if (resultado.tipo === 'financiamento') return resultado.valorParcela;
    return 0;
  };

  const getValorBaloes = () => {
    if (resultado.tipo === 'financiamento' && resultado.incluirBaloes) {
      return resultado.valorBalao;
    }
    return 0;
  };

  const getCustoTotal = () => {
    if (resultado.tipo === 'avista') return resultado.valorFinal;
    if (resultado.tipo === 'curto') return resultado.totalPago;
    if (resultado.tipo === 'financiamento') return resultado.custoTotal;
    return 0;
  };

  const cards = [
    {
      title: 'Valor da Entrada',
      value: getValorEntrada(),
      icon: Banknote,
      color: 'text-green-600',
    },
    {
      title: 'Valor da 1ª Parcela',
      value: getValorParcela(),
      icon: CreditCard,
      color: 'text-blue-600',
    },
    {
      title: 'Balões Anuais',
      value: getValorBaloes(),
      icon: Calendar,
      color: 'text-amber-600',
    },
    {
      title: 'Custo Efetivo Total',
      value: getCustoTotal(),
      icon: Wallet,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </div>
            <p className={`text-lg font-bold ${card.color}`}>
              {card.value > 0 ? formatarMoeda(card.value) : '-'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
