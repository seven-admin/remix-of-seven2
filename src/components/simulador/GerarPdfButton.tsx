import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
import {
  DadosLote,
  DadosCliente,
  DadosEntrada,
  ResultadoSimulacao,
} from '@/types/simulador.types';
import { formatarMoeda } from '@/lib/calculoFinanciamento';
import { FORMA_QUITACAO_LABELS } from '@/types/condicoesPagamento.types';

interface GerarPdfButtonProps {
  dadosLote: DadosLote;
  dadosCliente: DadosCliente;
  dadosEntrada: DadosEntrada;
  resultado: ResultadoSimulacao | null;
}

export function GerarPdfButton({
  dadosLote,
  dadosCliente,
  dadosEntrada,
  resultado,
}: GerarPdfButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const gerarPdf = () => {
    if (!resultado) return;

    const element = document.createElement('div');
    element.innerHTML = gerarHtmlPdf();

    const opt = {
      margin: 10,
      filename: `simulacao-${dadosCliente.nome || 'cliente'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  const getDescricaoPlano = () => {
    if (!resultado) return '';
    if (resultado.tipo === 'avista') {
      return `À Vista com ${resultado.percentualDesconto}% de desconto`;
    }
    if (resultado.tipo === 'curto') {
      return `Curto Prazo - ${resultado.quantidadeParcelas}x sem juros`;
    }
    if (resultado.tipo === 'financiamento') {
      let desc = `Financiamento ${resultado.prazoMeses} meses`;
      if (resultado.incluirBaloes && resultado.quantidadeBaloes > 0) {
        desc += ` com ${resultado.quantidadeBaloes} Balões Anuais`;
      }
      return desc;
    }
    return '';
  };

  const gerarTextoJuridico = () => {
    if (!resultado) return '';

    if (resultado.tipo === 'avista') {
      return `O preço de ${formatarMoeda(resultado.valorOriginal)} será pago à vista, 
      com desconto de ${resultado.percentualDesconto}%, totalizando ${formatarMoeda(resultado.valorFinal)}.`;
    }

    if (resultado.tipo === 'curto') {
      return `O preço de ${formatarMoeda(resultado.valorOriginal)} será pago da seguinte forma: 
      entrada de ${formatarMoeda(resultado.valorEntrada)} (${resultado.percentualEntrada}%) + 
      ${resultado.quantidadeParcelas} parcelas mensais de ${formatarMoeda(resultado.valorParcela)}, 
      totalizando ${formatarMoeda(resultado.totalPago)}.`;
    }

    if (resultado.tipo === 'financiamento') {
      let texto = `O preço de ${formatarMoeda(resultado.valorOriginal)} será pago da seguinte forma: 
      entrada de ${formatarMoeda(resultado.valorEntrada)} (${resultado.percentualEntrada}%) + 
      ${resultado.prazoMeses} parcelas mensais de ${formatarMoeda(resultado.valorParcela)}`;

      if (resultado.incluirBaloes && resultado.quantidadeBaloes > 0) {
        texto += ` + ${resultado.quantidadeBaloes} reforços anuais de ${formatarMoeda(resultado.valorBalao)}`;
      }

      texto += `, totalizando ${formatarMoeda(resultado.custoTotal)}. Taxa de juros: ${resultado.taxaJurosAnual}% a.a.`;
      return texto;
    }

    return '';
  };

  const gerarTabelaCronograma = () => {
    if (resultado?.tipo !== 'financiamento' || !resultado.cronograma) return '';

    return resultado.cronograma
      .map(
        (p) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${p.mes}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${format(p.vencimento, 'dd/MM/yyyy')}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatarMoeda(p.parcela)}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${p.balao > 0 ? formatarMoeda(p.balao) : '-'}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatarMoeda(p.total)}</td>
      </tr>
    `
      )
      .join('');
  };

  const gerarHtmlPdf = () => {
    return `
      <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #0f172a;">SIMULAÇÃO DE PAGAMENTO</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Seven Group 360</p>
        </div>

        <!-- Dados Gerais -->
        <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Cliente</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${dadosCliente.nome || 'Não informado'}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Data da Simulação</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${format(dadosLote.dataSimulacao, 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Empreendimento</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${dadosLote.empreendimentoNome || 'Não selecionado'}</p>
            </div>
          </div>
        </div>

        <!-- Dados do Lote -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">DADOS DO LOTE</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Valor do Lote</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">${formatarMoeda(dadosLote.valor)}</p>
            </div>
            ${dadosLote.area ? `
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Área</p>
                <p style="margin: 0; font-size: 14px; font-weight: bold;">${dadosLote.area} m²</p>
              </div>
            ` : ''}
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Entrada</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">${formatarMoeda(dadosEntrada.valor)} (${FORMA_QUITACAO_LABELS[dadosEntrada.formaQuitacao]})</p>
            </div>
          </div>
        </div>

        <!-- Condição de Pagamento -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">CONDIÇÃO DE PAGAMENTO</h2>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e40af;">${getDescricaoPlano()}</p>
          </div>
        </div>

        <!-- Resumo -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">RESUMO DA PROPOSTA</h2>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">${gerarTextoJuridico()}</p>
          </div>
        </div>

        <!-- Cronograma (se financiamento) -->
        ${resultado?.tipo === 'financiamento' && resultado.cronograma ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">CRONOGRAMA (24 PRIMEIROS MESES)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">Mês</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">Vencimento</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Parcela</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Balão</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${gerarTabelaCronograma()}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Rodapé -->
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8;">
            Este documento é uma simulação e não representa proposta formal de venda.
          </p>
          <p style="margin: 5px 0 0 0; font-size: 10px; color: #94a3b8;">
            Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    `;
  };

  const isDisabled = !resultado || !dadosLote.valor;

  return (
    <Button
      size="lg"
      className="w-full md:w-auto"
      onClick={gerarPdf}
      disabled={isDisabled}
    >
      <FileDown className="h-5 w-5 mr-2" />
      Gerar Proposta em PDF
    </Button>
  );
}
