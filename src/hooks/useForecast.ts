import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClienteTemperatura } from '@/types/clientes.types';

interface FunilTemperaturaItem {
  temperatura: ClienteTemperatura;
  quantidade: number;
  percentual: number;
}

export function useFunilTemperatura(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'funil-temperatura', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<FunilTemperaturaItem[]> => {
      // Definir período padrão (mês atual)
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      
      // Se não há filtro, considerar clientes que possuem atividades no período
      if (!gestorId) {
        // Buscar clientes que têm atividades no período
        const { data: atividades, error: atividadesError } = await supabase
          .from('atividades' as any)
          .select('cliente_id')
          .gte('data_hora', inicioMes.toISOString())
          .lte('data_hora', fimMes.toISOString())
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
      }

      // Com filtro (por gestor): considerar apenas clientes que possuem atividades do gestor no período.
      const { data: atividades, error: atividadesError } = await supabase
        .from('atividades' as any)
        .select('cliente_id')
        .eq('gestor_id', gestorId)
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
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

export function useVisitasPorEmpreendimento(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'visitas-por-empreendimento', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      // Usar período passado ou mês atual como padrão
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      let query = supabase
        .from('atividades' as any)
        .select(`id, empreendimento_id, data_hora, empreendimento:empreendimentos(id, nome)`)
        .eq('tipo', 'visita')
        .not('empreendimento_id', 'is', null)
        .neq('status', 'cancelada')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString());

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const agrupado = new Map<string, { empreendimento_id: string; empreendimento_nome: string; total_visitas: number; visitas_mes_atual: number }>();
      (data || []).forEach((ativ: any) => {
        if (!ativ.empreendimento_id || !ativ.empreendimento) return;
        const existing = agrupado.get(ativ.empreendimento_id);
        if (existing) {
          existing.total_visitas++;
          existing.visitas_mes_atual++;
        } else {
          agrupado.set(ativ.empreendimento_id, {
            empreendimento_id: ativ.empreendimento_id,
            empreendimento_nome: ativ.empreendimento.nome,
            total_visitas: 1,
            visitas_mes_atual: 1,
          });
        }
      });

      return Array.from(agrupado.values()).sort((a, b) => b.total_visitas - a.total_visitas).slice(0, 10);
    },
  });
}

export function useResumoAtividades(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'resumo-atividades', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Usar período passado ou mês atual como padrão
      const inicioMes = dataInicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = dataFim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

      let query = supabase
        .from('atividades' as any)
        .select('status, data_hora, requer_followup, data_followup')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString());
      if (gestorId) query = query.eq('gestor_id', gestorId);

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
          concluidasMes++;
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

export function useAtividadesPorTipoPorSemana(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'atividades-por-tipo-semana', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<AtividadeSemanaItem[]> => {
      // Usar período passado ou mês atual como padrão
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const fimMes = dataFim || new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59);
      
      let query = supabase
        .from('atividades' as any)
        .select('tipo, data_hora')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
        .neq('status', 'cancelada');

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
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
      
      // Retornar todas as semanas que têm dados ou até a semana atual do mês selecionado
      const hoje = new Date();
      const isPeriodoAtual = inicioMes.getMonth() === hoje.getMonth() && inicioMes.getFullYear() === hoje.getFullYear();
      
      if (isPeriodoAtual) {
        const diaAtual = hoje.getDate();
        const semanaAtual = Math.min(Math.floor((diaAtual - 1) / 7), 4);
        return semanas.slice(0, semanaAtual + 1);
      }
      
      // Para meses passados, retornar todas as semanas com dados
      return semanas.filter((s, i) => s.visita + s.ligacao + s.reuniao + s.atendimento > 0 || i < 4);
    },
  });
}

// Novo hook: Atividades por corretor
export function useAtividadesPorCorretor(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'atividades-por-corretor', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      // Usar período passado ou mês atual como padrão
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      
      let query = supabase
        .from('atividades' as any)
        .select('corretor_id, status, corretor:corretores(id, nome_completo)')
        .not('corretor_id', 'is', null)
        .neq('status', 'cancelada')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString());

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
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
export function useProximasAtividades(limite: number = 10, gestorId?: string) {
  return useQuery({
    queryKey: ['forecast', 'proximas-atividades', limite, gestorId || 'all'],
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

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
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

export function useResumoAtendimentos(gestorId?: string, dataInicio?: Date, dataFim?: Date) {
  return useQuery({
    queryKey: ['forecast', 'resumo-atendimentos', gestorId || 'all', dataInicio?.toISOString(), dataFim?.toISOString()],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<ResumoAtendimentos> => {
      // Usar período passado ou mês atual como padrão
      const inicioMes = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fimMes = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      
      let query = supabase
        .from('atividades' as any)
        .select('categoria, status')
        .eq('tipo', 'atendimento')
        .neq('status', 'cancelada')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString());

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
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
