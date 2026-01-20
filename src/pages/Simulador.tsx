import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import {
  DadosLoteCard,
  DadosClienteCard,
  DadosEntradaCard,
  OpcaoAVista,
  OpcaoCurtoPrazo,
  OpcaoFinanciamento,
  ResumoCards,
  GerarPdfButton,
} from '@/components/simulador';
import {
  DadosLote,
  DadosCliente,
  DadosEntrada,
  ConfigAVista,
  ConfigCurtoPrazo,
  ConfigFinanciamento,
  ResultadoSimulacao,
} from '@/types/simulador.types';
import {
  calcularAVista,
  calcularCurtoPrazo,
  calcularFinanciamento,
} from '@/lib/calculoFinanciamento';

export default function Simulador() {
  // Estado dos dados
  const [dadosLote, setDadosLote] = useState<DadosLote>({
    valor: 0,
    dataSimulacao: new Date(),
  });

  const [dadosCliente, setDadosCliente] = useState<DadosCliente>({
    nome: '',
  });

  const [dadosEntrada, setDadosEntrada] = useState<DadosEntrada>({
    formaQuitacao: 'dinheiro',
    formaPagamento: 'boleto',
    valor: 0,
  });

  // Opção selecionada
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<'avista' | 'curto' | 'financiamento'>('avista');

  // Configurações de cada opção
  const [configAVista, setConfigAVista] = useState<ConfigAVista>({
    percentualDesconto: 7,
  });

  const [configCurtoPrazo, setConfigCurtoPrazo] = useState<ConfigCurtoPrazo>({
    percentualEntrada: 10,
    quantidadeParcelas: 24,
  });

  const [configFinanciamento, setConfigFinanciamento] = useState<ConfigFinanciamento>({
    percentualEntrada: 6,
    prazoMeses: 180,
    taxaJurosAnual: 11,
    incluirBaloes: false,
    valorBalao: 0,
    maxBaloes: 15,
  });

  const limparProposta = () => {
    setDadosLote({ valor: 0, dataSimulacao: new Date() });
    setDadosCliente({ nome: '' });
    setDadosEntrada({ formaQuitacao: 'dinheiro', formaPagamento: 'boleto', valor: 0 });
    setOpcaoSelecionada('avista');
    setConfigAVista({ percentualDesconto: 7 });
    setConfigCurtoPrazo({ percentualEntrada: 10, quantidadeParcelas: 24 });
    setConfigFinanciamento({
      percentualEntrada: 6,
      prazoMeses: 180,
      taxaJurosAnual: 11,
      incluirBaloes: false,
      valorBalao: 0,
      maxBaloes: 15,
    });
  };

  // Cálculo reativo do resultado
  const resultado = useMemo<ResultadoSimulacao | null>(() => {
    if (dadosLote.valor <= 0) return null;

    switch (opcaoSelecionada) {
      case 'avista':
        return calcularAVista(dadosLote.valor, configAVista.percentualDesconto);

      case 'curto':
        return calcularCurtoPrazo(
          dadosLote.valor,
          configCurtoPrazo.percentualEntrada,
          configCurtoPrazo.quantidadeParcelas
        );

      case 'financiamento':
        // Verificar se quantidade de balões excede o limite
        const qtdBaloes = Math.floor(configFinanciamento.prazoMeses / 12);

        if (configFinanciamento.incluirBaloes && qtdBaloes > configFinanciamento.maxBaloes) {
          return null;
        }

        return calcularFinanciamento(
          dadosLote.valor,
          configFinanciamento.percentualEntrada,
          configFinanciamento.prazoMeses,
          configFinanciamento.taxaJurosAnual,
          configFinanciamento.incluirBaloes,
          configFinanciamento.valorBalao,
          dadosLote.dataSimulacao
        );

      default:
        return null;
    }
  }, [dadosLote, opcaoSelecionada, configAVista, configCurtoPrazo, configFinanciamento]);

  return (
    <MainLayout
      title="Simulador de Proposta"
      subtitle="Calcule condições de pagamento e gere propostas em PDF"
    >
      <div className="space-y-6">
        {/* Linha 1: Cliente e Lote */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DadosClienteCard dados={dadosCliente} onChange={setDadosCliente} />
          <DadosLoteCard dados={dadosLote} onChange={setDadosLote} />
        </div>

        {/* Linha 2: Entrada */}
        <DadosEntradaCard dados={dadosEntrada} onChange={setDadosEntrada} />

        <Separator />

        {/* Linha 3: Opções de Pagamento */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Condição de Pagamento</h2>
          <Tabs
            value={opcaoSelecionada}
            onValueChange={(v) => setOpcaoSelecionada(v as typeof opcaoSelecionada)}
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="avista" className="flex items-center gap-2">
                À Vista
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  {configAVista.percentualDesconto}% OFF
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="curto" className="flex items-center gap-2">
                Curto Prazo
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Sem Juros
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="financiamento" className="flex items-center gap-2">
                Financiamento
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                  Até 180x
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avista">
              <OpcaoAVista
                config={configAVista}
                resultado={resultado?.tipo === 'avista' ? resultado : null}
                onChange={setConfigAVista}
              />
            </TabsContent>

            <TabsContent value="curto">
              <OpcaoCurtoPrazo
                config={configCurtoPrazo}
                resultado={resultado?.tipo === 'curto' ? resultado : null}
                onChange={setConfigCurtoPrazo}
              />
            </TabsContent>

            <TabsContent value="financiamento">
              <OpcaoFinanciamento
                config={configFinanciamento}
                resultado={resultado?.tipo === 'financiamento' ? resultado : null}
                onChange={setConfigFinanciamento}
                valorLote={dadosLote.valor}
              />
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        {/* Resumo */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Resumo</h2>
          <ResumoCards resultado={resultado} valorEntradaDigitado={dadosEntrada.valor} />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={limparProposta}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Proposta
          </Button>
          <GerarPdfButton
            dadosLote={dadosLote}
            dadosCliente={dadosCliente}
            dadosEntrada={dadosEntrada}
            resultado={resultado}
          />
        </div>
      </div>
    </MainLayout>
  );
}
