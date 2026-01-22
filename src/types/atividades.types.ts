// Tipos para o módulo de Atividades Comerciais

import type { ClienteTemperatura } from './clientes.types';

export type AtividadeTipo = 'ligacao' | 'reuniao' | 'visita' | 'atendimento';
export type AtividadeStatus = 'pendente' | 'concluida' | 'cancelada';
export type AtividadeCategoria = 'primeiro_atendimento' | 'retorno';

export const ATIVIDADE_TIPO_LABELS: Record<AtividadeTipo, string> = {
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  visita: 'Visita',
  atendimento: 'Atendimento'
};

export const ATIVIDADE_CATEGORIA_LABELS: Record<AtividadeCategoria, string> = {
  primeiro_atendimento: 'Primeiro Atendimento',
  retorno: 'Retorno'
};

export const ATIVIDADE_STATUS_LABELS: Record<AtividadeStatus, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

export const ATIVIDADE_STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 text-gray-800 border-gray-200'
};

export interface Atividade {
  id: string;
  tipo: AtividadeTipo;
  categoria?: AtividadeCategoria | null;
  status: AtividadeStatus;
  titulo: string;
  cliente_id?: string | null;
  cliente?: { 
    id: string; 
    nome: string; 
    temperatura: ClienteTemperatura;
  } | null;
  corretor_id?: string | null;
  corretor?: { 
    id: string; 
    nome_completo: string;
  } | null;
  imobiliaria_id?: string | null;
  imobiliaria?: { 
    id: string; 
    nome: string;
  } | null;
  empreendimento_id?: string | null;
  empreendimento?: { 
    id: string; 
    nome: string;
  } | null;
  gestor_id?: string | null;
  gestor?: { 
    id: string;
    full_name: string;
  } | null;
  created_by?: string | null;
  criador?: {
    id: string;
    full_name: string;
  } | null;
  deadline_date?: string | null;
  data_hora: string;
  duracao_minutos?: number | null;
  observacoes?: string | null;
  temperatura_cliente?: ClienteTemperatura | null;
  resultado?: string | null;
  requer_followup: boolean;
  data_followup?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtividadeFormData {
  tipo: AtividadeTipo;
  categoria?: AtividadeCategoria;
  titulo: string;
  cliente_id?: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  empreendimento_id?: string;
  gestor_id?: string;
  data_hora: string;
  duracao_minutos?: number;
  observacoes?: string;
  temperatura_cliente?: ClienteTemperatura;
  requer_followup?: boolean;
  data_followup?: string;
  deadline_date?: string;
}

export interface ConcluirAtividadeData {
  resultado: string;
  temperatura_cliente?: ClienteTemperatura;
  requer_followup?: boolean;
  data_followup?: string;
}

export interface AtividadeFilters {
  tipo?: AtividadeTipo;
  categoria?: AtividadeCategoria;
  status?: AtividadeStatus;
  // legado: alguns pontos antigos do app ainda referenciam gestor_id como filtro
  // (equivalente ao responsavel_id no novo padrão)
  gestor_id?: string;
  responsavel_id?: string;
  created_by?: string;
  empreendimento_id?: string;
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface ConfiguracoesAtividades {
  id: string;
  dias_retorno_corretor: number;
  alerta_followup_horas: number;
}