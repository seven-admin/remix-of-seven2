import { FormaQuitacao, FormaPagamento } from './condicoesPagamento.types';

export interface DadosLote {
  empreendimentoId?: string;
  empreendimentoNome?: string;
  unidadeId?: string;
  unidadeNumero?: string;
  valor: number;
  area?: number;
  dataSimulacao: Date;
}

export interface DadosCliente {
  id?: string;
  nome: string;
}

export interface DadosEntrada {
  formaQuitacao: FormaQuitacao;
  formaPagamento?: FormaPagamento;
  valor: number;
  bemDescricao?: string;
  bemMarca?: string;
  bemModelo?: string;
  bemAno?: string;
  bemPlaca?: string;
  bemValorAvaliado?: number;
}

// Configurações editáveis pelo usuário
export interface ConfigAVista {
  percentualDesconto: number;
}

export interface ConfigCurtoPrazo {
  percentualEntrada: number;
  quantidadeParcelas: number;
}

export interface ConfigFinanciamento {
  percentualEntrada: number;
  prazoMeses: number;
  taxaJurosAnual: number;
  incluirBaloes: boolean;
  valorBalao: number;
  maxBaloes: number;
}

// Resultados calculados
export interface ResultadoAVista {
  tipo: 'avista';
  valorOriginal: number;
  percentualDesconto: number;
  valorDesconto: number;
  valorFinal: number;
}

export interface ResultadoCurtoPrazo {
  tipo: 'curto';
  valorOriginal: number;
  percentualEntrada: number;
  valorEntrada: number;
  quantidadeParcelas: number;
  valorParcela: number;
  totalPago: number;
}

export interface ResultadoFinanciamento {
  tipo: 'financiamento';
  valorOriginal: number;
  percentualEntrada: number;
  valorEntrada: number;
  saldoFinanciado: number;
  prazoMeses: number;
  taxaJurosAnual: number;
  taxaJurosMensal: number;
  incluirBaloes: boolean;
  valorBalao: number;
  quantidadeBaloes: number;
  valorParcela: number;
  custoTotal: number;
  cronograma: ParcelaCronograma[];
}

export interface ParcelaCronograma {
  mes: number;
  vencimento: Date;
  parcela: number;
  balao: number;
  total: number;
}

export type ResultadoSimulacao = ResultadoAVista | ResultadoCurtoPrazo | ResultadoFinanciamento;
