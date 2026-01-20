import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClienteTemperatura } from '@/types/clientes.types';

interface FunilTemperaturaItem {
  temperatura: ClienteTemperatura;
  quantidade: number;
  percentual: number;
}

export function useFunilTemperatura(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'funil-temperatura', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<FunilTemperaturaItem[]> => {
      // Se não há filtro por empreendimento, mantém a lógica atual (todos os clientes ativos)
      if (!empreendimentoId) {
        const { data, error } = await supabase.from('clientes').select('temperatura').eq('is_active', true);
        if (error) throw error;

        const contagem: Record<ClienteTemperatura, number> = { frio: 0, morno: 0, quente: 0 };
        (data || []).forEach((cliente: any) => {
          if (cliente.temperatura in contagem) contagem[cliente.temperatura as ClienteTemperatura]++;
        });

        const total = Object.values(contagem).reduce((a, b) => a + b, 0);
        return (['frio', 'morno', 'quente'] as ClienteTemperatura[]).map((temp) => ({
          temperatura: temp,
          quantidade: contagem[temp],
          percentual: total > 0 ? Math.round((contagem[temp] / total) * 100) : 0,
        }));
      }

      // Com filtro: considerar apenas clientes que possuem atividades no empreendimento.
      const { data: atividades, error: atividadesError } = await supabase
        .from('atividades' as any)
        .select('cliente_id')
        .eq('empreendimento_id', empreendimentoId)
        .not('cliente_id', 'is', null)
        .neq('status', 'cancelada');

      if (atividadesError) throw atividadesError;

      const clienteIds = Array.from(new Set((atividades || []).map((a: any) => a.cliente_id).filter(Boolean)));
      if (clienteIds.length === 0) {
        return (['frio', 'morno', 'quente'] as ClienteTemperatura[]).map((temp) => ({
          temperatura: temp,
          quantidade: 0,
          percentual: 0,
        }));
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('temperatura')
        .eq('is_active', true)
        .in('id', clienteIds);
      if (error) throw error;

      const contagem: Record<ClienteTemperatura, number> = { frio: 0, morno: 0, quente: 0 };
      (data || []).forEach((cliente: any) => {
        if (cliente.temperatura in contagem) contagem[cliente.temperatura as ClienteTemperatura]++;
      });

      const total = Object.values(contagem).reduce((a, b) => a + b, 0);
      return (['frio', 'morno', 'quente'] as ClienteTemperatura[]).map((temp) => ({
        temperatura: temp,
        quantidade: contagem[temp],
        percentual: total > 0 ? Math.round((contagem[temp] / total) * 100) : 0,
      }));
    },
  });
}

export function useVisitasPorEmpreendimento(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'visitas-por-empreendimento', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      let query = supabase
        .from('atividades' as any)
        .select(`id, empreendimento_id, data_hora, empreendimento:empreendimentos(id, nome)`)
        .eq('tipo', 'visita')
        .not('empreendimento_id', 'is', null)
        .neq('status', 'cancelada');

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const agrupado = new Map<string, { empreendimento_id: string; empreendimento_nome: string; total_visitas: number; visitas_mes_atual: number }>();
      (data || []).forEach((ativ: any) => {
        if (!ativ.empreendimento_id || !ativ.empreendimento) return;
        const existing = agrupado.get(ativ.empreendimento_id);
        const isMesAtual = new Date(ativ.data_hora) >= inicioMes;
        if (existing) {
          existing.total_visitas++;
          if (isMesAtual) existing.visitas_mes_atual++;
        } else {
          agrupado.set(ativ.empreendimento_id, {
            empreendimento_id: ativ.empreendimento_id,
            empreendimento_nome: ativ.empreendimento.nome,
            total_visitas: 1,
            visitas_mes_atual: isMesAtual ? 1 : 0,
          });
        }
      });

      return Array.from(agrupado.values()).sort((a, b) => b.total_visitas - a.total_visitas).slice(0, 10);
    },
  });
}

export function useResumoAtividades(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'resumo-atividades', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      let query = supabase
        .from('atividades' as any)
        .select('status, data_hora, requer_followup, data_followup');
      if (empreendimentoId) query = query.eq('empreendimento_id', empreendimentoId);

      const { data, error } = await query;
      if (error) throw error;

      let pendentes = 0, concluidas = 0, vencidas = 0, followupsPendentes = 0, concluidasMes = 0, hojeCount = 0;
      (data || []).forEach((ativ: any) => {
        const dataAtiv = new Date(ativ.data_hora);
        const isHoje = dataAtiv.toDateString() === hoje.toDateString();
        if (ativ.status === 'pendente') {
          pendentes++;
          if (dataAtiv < hoje) vencidas++;
          if (isHoje) hojeCount++;
        }
        if (ativ.status === 'concluida') {
          concluidas++;
          if (dataAtiv >= inicioMes) concluidasMes++;
        }
        if (ativ.requer_followup && ativ.data_followup && new Date(ativ.data_followup) <= hoje && ativ.status === 'concluida') followupsPendentes++;
      });

      const taxaConclusao = data && data.length > 0 ? Math.round((concluidas / data.length) * 100) : 0;

      return { pendentes, concluidas, vencidas, followupsPendentes, concluidasMes, total: data?.length || 0, hoje: hojeCount, taxaConclusao };
    },
  });
}

// Novo hook: Atividades por tipo
export function useAtividadesPorTipo() {
  return useQuery({
    queryKey: ['forecast', 'atividades-por-tipo'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades' as any)
        .select('tipo')
        .neq('status', 'cancelada');

      if (error) throw error;

      const contagem = new Map<string, number>();
      (data || []).forEach((ativ: any) => {
        contagem.set(ativ.tipo, (contagem.get(ativ.tipo) || 0) + 1);
      });

      return Array.from(contagem.entries())
        .map(([tipo, quantidade]) => ({ tipo, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);
    },
  });
}

// Hook: Atividades por tipo segmentado por semana
export interface AtividadeSemanaItem {
  semana: string;
  visita: number;
  ligacao: number;
  reuniao: number;
  atendimento: number;
}

export function useAtividadesPorTipoPorSemana(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'atividades-por-tipo-semana', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<AtividadeSemanaItem[]> => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59);
      
      let query = supabase
        .from('atividades' as any)
        .select('tipo, data_hora')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
        .neq('status', 'cancelada');

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Inicializar semanas
      const semanas: AtividadeSemanaItem[] = [
        { semana: 'Sem 1', visita: 0, ligacao: 0, reuniao: 0, atendimento: 0 },
        { semana: 'Sem 2', visita: 0, ligacao: 0, reuniao: 0, atendimento: 0 },
        { semana: 'Sem 3', visita: 0, ligacao: 0, reuniao: 0, atendimento: 0 },
        { semana: 'Sem 4', visita: 0, ligacao: 0, reuniao: 0, atendimento: 0 },
        { semana: 'Sem 5', visita: 0, ligacao: 0, reuniao: 0, atendimento: 0 },
      ];
      
      (data || []).forEach((ativ: any) => {
        const dia = new Date(ativ.data_hora).getDate();
        const semanaIndex = Math.min(Math.floor((dia - 1) / 7), 4);
        const tipo = ativ.tipo as keyof Omit<AtividadeSemanaItem, 'semana'>;
        
        if (semanas[semanaIndex] && tipo in semanas[semanaIndex]) {
          (semanas[semanaIndex][tipo] as number)++;
        }
      });
      
      // Retornar apenas semanas com dados ou até a semana atual
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      const semanaAtual = Math.min(Math.floor((diaAtual - 1) / 7), 4);
      
      return semanas.slice(0, semanaAtual + 1);
    },
  });
}

// Novo hook: Atividades por corretor
export function useAtividadesPorCorretor(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'atividades-por-corretor', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      let query = supabase
        .from('atividades' as any)
        .select('corretor_id, status, corretor:corretores(id, nome_completo)')
        .not('corretor_id', 'is', null)
        .neq('status', 'cancelada');

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const agrupado = new Map<string, { corretor_id: string; nome: string; quantidade: number; concluidas: number }>();
      (data || []).forEach((ativ: any) => {
        if (!ativ.corretor_id || !ativ.corretor) return;
        const existing = agrupado.get(ativ.corretor_id);
        if (existing) {
          existing.quantidade++;
          if (ativ.status === 'concluida') existing.concluidas++;
        } else {
          agrupado.set(ativ.corretor_id, {
            corretor_id: ativ.corretor_id,
            nome: ativ.corretor.nome_completo || 'Corretor',
            quantidade: 1,
            concluidas: ativ.status === 'concluida' ? 1 : 0,
          });
        }
      });

      return Array.from(agrupado.values()).sort((a, b) => b.quantidade - a.quantidade);
    },
  });
}

// Novo hook: Calendário de atividades (por dia)
export function useCalendarioAtividades(ano: number, mes: number) {
  return useQuery({
    queryKey: ['forecast', 'calendario-atividades', ano, mes],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('atividades' as any)
        .select('data_hora')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
        .neq('status', 'cancelada');

      if (error) throw error;

      const contagem = new Map<number, number>();
      (data || []).forEach((ativ: any) => {
        const dia = new Date(ativ.data_hora).getDate();
        contagem.set(dia, (contagem.get(dia) || 0) + 1);
      });

      return Array.from(contagem.entries())
        .map(([dia, quantidade]) => ({ dia, quantidade }))
        .sort((a, b) => a.dia - b.dia);
    },
  });
}

// Novo hook: Próximas atividades
export function useProximasAtividades(limite: number = 10, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'proximas-atividades', limite, empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const agora = new Date().toISOString();

      let query = supabase
        .from('atividades' as any)
        .select(`
          id, titulo, tipo, categoria, data_hora, status,
          cliente:clientes(id, nome),
          corretor:corretores(id, nome_completo),
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('status', 'pendente')
        .gte('data_hora', agora)
        .order('data_hora', { ascending: true });

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query.limit(limite);

      if (error) throw error;

      return data || [];
    },
  });
}

type ResumoAtendimentos = {
  novos: { total: number; pendentes: number; concluidos: number };
  retornos: { total: number; pendentes: number; concluidos: number };
};

export function useResumoAtendimentos(empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast', 'resumo-atendimentos', empreendimentoId || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<ResumoAtendimentos> => {
      let query = supabase
        .from('atividades' as any)
        .select('categoria, status')
        .eq('tipo', 'atendimento')
        .neq('status', 'cancelada');

      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const resumo: ResumoAtendimentos = {
        novos: { total: 0, pendentes: 0, concluidos: 0 },
        retornos: { total: 0, pendentes: 0, concluidos: 0 },
      };

      (data || []).forEach((ativ: any) => {
        const bucket = ativ.categoria === 'retorno' ? resumo.retornos : resumo.novos;
        bucket.total++;
        if (ativ.status === 'pendente') bucket.pendentes++;
        if (ativ.status === 'concluida') bucket.concluidos++;
      });

      return resumo;
    },
  });
}
