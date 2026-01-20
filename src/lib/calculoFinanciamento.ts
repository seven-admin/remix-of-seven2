import {
  ResultadoAVista,
  ResultadoCurtoPrazo,
  ResultadoFinanciamento,
  ParcelaCronograma,
} from '@/types/simulador.types';

/**
 * Converte taxa anual para taxa mensal composta
 * Fórmula: (1 + taxaAnual)^(1/12) - 1
 */
export function taxaAnualParaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
}

/**
 * Calcula o Valor Presente dos balões anuais
 * VP = Σ (valorBalao / (1 + taxaMensal)^mês)
 */
export function calcularVPBaloes(
  valorBalao: number,
  qtdBaloes: number,
  taxaMensal: number
): number {
  let vpTotal = 0;
  for (let i = 1; i <= qtdBaloes; i++) {
    const mes = i * 12; // Mês 12, 24, 36...
    vpTotal += valorBalao / Math.pow(1 + taxaMensal, mes);
  }
  return vpTotal;
}

/**
 * Calcula a prestação mensal usando Tabela Price (PMT)
 * PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
 */
export function calcularPMT(
  valorPresente: number,
  taxaMensal: number,
  prazo: number
): number {
  if (taxaMensal === 0) return valorPresente / prazo;
  const fator = Math.pow(1 + taxaMensal, prazo);
  return valorPresente * (taxaMensal * fator) / (fator - 1);
}

/**
 * Cálculo À Vista com desconto customizado
 */
export function calcularAVista(
  valorLote: number,
  percentualDesconto: number
): ResultadoAVista {
  const valorDesconto = valorLote * (percentualDesconto / 100);
  const valorFinal = valorLote - valorDesconto;

  return {
    tipo: 'avista',
    valorOriginal: valorLote,
    percentualDesconto,
    valorDesconto,
    valorFinal,
  };
}

/**
 * Cálculo Curto Prazo (sem juros)
 */
export function calcularCurtoPrazo(
  valorLote: number,
  percentualEntrada: number,
  quantidadeParcelas: number
): ResultadoCurtoPrazo {
  const valorEntrada = valorLote * (percentualEntrada / 100);
  const saldo = valorLote - valorEntrada;
  const valorParcela = quantidadeParcelas > 0 ? saldo / quantidadeParcelas : 0;
  const totalPago = valorEntrada + valorParcela * quantidadeParcelas;

  return {
    tipo: 'curto',
    valorOriginal: valorLote,
    percentualEntrada,
    valorEntrada,
    quantidadeParcelas,
    valorParcela,
    totalPago,
  };
}

/**
 * Cálculo Financiamento completo (Tabela Price com balões)
 */
export function calcularFinanciamento(
  valorLote: number,
  percentualEntrada: number,
  prazoMeses: number,
  taxaJurosAnual: number,
  incluirBaloes: boolean,
  valorBalao: number,
  dataInicio: Date
): ResultadoFinanciamento {
  const taxaMensal = taxaAnualParaMensal(taxaJurosAnual);
  const valorEntrada = valorLote * (percentualEntrada / 100);
  const saldoFinanciado = valorLote - valorEntrada;

  const quantidadeBaloes = incluirBaloes ? Math.floor(prazoMeses / 12) : 0;
  const vpBaloes = incluirBaloes
    ? calcularVPBaloes(valorBalao, quantidadeBaloes, taxaMensal)
    : 0;

  const saldoParaPMT = Math.max(0, saldoFinanciado - vpBaloes);
  const valorParcela = calcularPMT(saldoParaPMT, taxaMensal, prazoMeses);

  const totalParcelas = valorParcela * prazoMeses;
  const totalBaloes = valorBalao * quantidadeBaloes;
  const custoTotal = valorEntrada + totalParcelas + totalBaloes;

  const cronograma = gerarCronograma(
    valorParcela,
    valorBalao,
    dataInicio,
    Math.min(prazoMeses, 24),
    incluirBaloes
  );

  return {
    tipo: 'financiamento',
    valorOriginal: valorLote,
    percentualEntrada,
    valorEntrada,
    saldoFinanciado,
    prazoMeses,
    taxaJurosAnual,
    taxaJurosMensal: taxaMensal * 100,
    incluirBaloes,
    valorBalao,
    quantidadeBaloes,
    valorParcela,
    custoTotal,
    cronograma,
  };
}

/**
 * Gera cronograma de parcelas
 */
export function gerarCronograma(
  valorParcela: number,
  valorBalao: number,
  dataInicio: Date,
  meses: number,
  incluirBaloes: boolean
): ParcelaCronograma[] {
  const cronograma: ParcelaCronograma[] = [];

  for (let i = 1; i <= meses; i++) {
    const vencimento = new Date(dataInicio);
    vencimento.setMonth(vencimento.getMonth() + i);

    const ehMesBalao = incluirBaloes && i % 12 === 0;
    const balao = ehMesBalao ? valorBalao : 0;

    cronograma.push({
      mes: i,
      vencimento,
      parcela: valorParcela,
      balao,
      total: valorParcela + balao,
    });
  }

  return cronograma;
}

/**
 * Formata valor para moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number, casas: number = 2): string {
  return `${valor.toFixed(casas)}%`;
}

/**
 * Converte string de entrada decimal (aceita vírgula ou ponto) para número
 */
export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
