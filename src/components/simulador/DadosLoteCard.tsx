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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Building2, CalendarIcon, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DadosLote } from '@/types/simulador.types';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { useConfiguracaoComercial } from '@/hooks/useConfiguracaoComercial';
import { useState, useEffect } from 'react';
import { parseDecimalInput } from '@/lib/calculoFinanciamento';

interface DadosLoteCardProps {
  dados: DadosLote;
  onChange: (dados: DadosLote) => void;
}

export function DadosLoteCard({ dados, onChange }: DadosLoteCardProps) {
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: unidades = [] } = useUnidades(dados.empreendimentoId);
  const { data: configComercial } = useConfiguracaoComercial(dados.empreendimentoId);
  const [areaInput, setAreaInput] = useState(dados.area?.toString().replace('.', ',') || '');

  useEffect(() => {
    if (dados.area === undefined || dados.area === 0) {
      setAreaInput('');
    }
  }, [dados.area]);

  const handleValorChange = (value: number) => {
    onChange({ ...dados, valor: value });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[\d.,]*$/.test(value)) {
      setAreaInput(value);
      const numValue = parseDecimalInput(value);
      onChange({ ...dados, area: numValue > 0 ? numValue : undefined });
    }
  };

  const handleEmpreendimentoChange = (id: string) => {
    const emp = empreendimentos.find((e) => e.id === id);
    onChange({
      ...dados,
      empreendimentoId: id,
      empreendimentoNome: emp?.nome,
      unidadeId: undefined,
      unidadeNumero: undefined,
    });
  };

  const handleUnidadeChange = (unidadeId: string) => {
    const unidade = unidades.find((u) => u.id === unidadeId);
    if (unidade) {
      const novoValor = unidade.valor ?? dados.valor;
      const novaArea = unidade.area_privativa ?? dados.area;
      
      onChange({
        ...dados,
        unidadeId,
        unidadeNumero: `${unidade.bloco?.nome || ''} - ${unidade.numero}`.trim(),
        valor: novoValor,
        area: novaArea,
      });
      
      if (novaArea) {
        setAreaInput(novaArea.toString().replace('.', ','));
      }
    }
  };

  const handleCalcularPeloM2 = () => {
    if (dados.area && configComercial?.valor_m2) {
      const valorCalculado = dados.area * configComercial.valor_m2;
      onChange({ ...dados, valor: valorCalculado });
    }
  };

  const formatValorInput = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter available units
  const unidadesDisponiveis = unidades.filter(
    (u) => u.status === 'disponivel' || u.id === dados.unidadeId
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Dados do Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empreendimento */}
          <div className="space-y-2">
            <Label>Empreendimento</Label>
            <Select
              value={dados.empreendimentoId || ''}
              onValueChange={handleEmpreendimentoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o empreendimento" />
              </SelectTrigger>
              <SelectContent>
                {empreendimentos.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unidade/Lote */}
          <div className="space-y-2">
            <Label>Unidade/Lote</Label>
            <Select
              value={dados.unidadeId || ''}
              onValueChange={handleUnidadeChange}
              disabled={!dados.empreendimentoId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesDisponiveis.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.bloco?.nome ? `${unidade.bloco.nome} - ` : ''}
                    {unidade.numero}
                    {unidade.valor
                      ? ` (R$ ${unidade.valor.toLocaleString('pt-BR')})`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor do Lote */}
          <div className="space-y-2">
            <Label>Valor do Lote (R$)</Label>
            <CurrencyInput
              value={dados.valor}
              onChange={handleValorChange}
            />
          </div>

          {/* Área */}
          <div className="space-y-2">
            <Label>Área (m²)</Label>
            <div className="relative">
              <Input
                type="text"
                value={areaInput}
                onChange={handleAreaChange}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                m²
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data da Simulação */}
          <div className="space-y-2">
            <Label>Data da Simulação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dados.dataSimulacao && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dados.dataSimulacao
                    ? format(dados.dataSimulacao, 'dd/MM/yyyy', { locale: ptBR })
                    : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dados.dataSimulacao}
                  onSelect={(date) =>
                    onChange({ ...dados, dataSimulacao: date || new Date() })
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Botão Calcular pelo m² */}
          <div className="space-y-2">
            <Label className="text-transparent select-none">Ação</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCalcularPeloM2}
              disabled={!dados.area || !configComercial?.valor_m2}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular pelo m²
              {configComercial?.valor_m2 && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (R$ {configComercial.valor_m2.toLocaleString('pt-BR')}/m²)
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}