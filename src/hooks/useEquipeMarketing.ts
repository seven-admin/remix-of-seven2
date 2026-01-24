import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';

export interface MembroEquipe {
  id: string;
  nome: string;
  avatar_url: string | null;
  emProducao: number;
  aguardando: number;
  revisao: number;
  concluidos: number;
  tempoMedio: number | null;
  taxaNoPrazo: number;
  totalTickets: number;
}

export interface EquipeMarketingData {
  membros: MembroEquipe[];
  kpis: {
    totalMembros: number;
    totalEmProducao: number;
    totalConcluidos: number;
    tempoMedioGeral: number | null;
    taxaNoPrazoGeral: number;
  };
  ticketsRecentes: {
    id: string;
    codigo: string;
    titulo: string;
    status: string;
    supervisor_id: string;
    supervisor_nome: string;
    data_entrega: string | null;
    data_previsao: string | null;
    categoria: string;
  }[];
}

interface Filters {
  periodoInicio?: Date;
  periodoFim?: Date;
}

export function useEquipeMarketing(filters?: Filters) {
  const periodoInicio = filters?.periodoInicio || startOfMonth(new Date());
  const periodoFim = filters?.periodoFim || endOfMonth(new Date());

  return useQuery({
    queryKey: ['equipe-marketing', periodoInicio.toISOString(), periodoFim.toISOString()],
    queryFn: async (): Promise<EquipeMarketingData> => {
      // Buscar todos os tickets ativos com supervisor
      const { data: tickets, error } = await supabase
        .from('projetos_marketing')
        .select(`
          id,
          codigo,
          titulo,
          status,
          categoria,
          supervisor_id,
          data_solicitacao,
          data_previsao,
          data_entrega,
          supervisor:profiles!projetos_marketing_supervisor_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .not('supervisor_id', 'is', null);

      if (error) throw error;

      // Agrupar tickets por supervisor
      const membroMap = new Map<string, {
        id: string;
        nome: string;
        avatar_url: string | null;
        tickets: typeof tickets;
      }>();

      tickets?.forEach(ticket => {
        if (!ticket.supervisor_id || !ticket.supervisor) return;
        
        const supervisor = ticket.supervisor as { id: string; full_name: string; avatar_url: string | null };
        
        if (!membroMap.has(ticket.supervisor_id)) {
          membroMap.set(ticket.supervisor_id, {
            id: ticket.supervisor_id,
            nome: supervisor.full_name || 'Sem nome',
            avatar_url: supervisor.avatar_url,
            tickets: []
          });
        }
        
        membroMap.get(ticket.supervisor_id)!.tickets.push(ticket);
      });

      // Calcular métricas por membro
      const membros: MembroEquipe[] = [];
      
      membroMap.forEach(membro => {
        const emProducao = membro.tickets.filter(t => t.status === 'em_producao').length;
        const aguardando = membro.tickets.filter(t => t.status === 'briefing' || t.status === 'triagem').length;
        const revisao = membro.tickets.filter(t => t.status === 'revisao' || t.status === 'aprovacao_cliente').length;
        
        // Tickets concluídos no período
        const ticketsConcluidos = membro.tickets.filter(t => {
          if (t.status !== 'concluido' || !t.data_entrega) return false;
          const dataEntrega = parseISO(t.data_entrega);
          return dataEntrega >= periodoInicio && dataEntrega <= periodoFim;
        });
        
        const concluidos = ticketsConcluidos.length;

        // Tempo médio de entrega
        let tempoMedio: number | null = null;
        const tempos: number[] = [];
        
        ticketsConcluidos.forEach(t => {
          if (t.data_solicitacao && t.data_entrega) {
            const dias = differenceInDays(parseISO(t.data_entrega), parseISO(t.data_solicitacao));
            if (dias >= 0) tempos.push(dias);
          }
        });
        
        if (tempos.length > 0) {
          tempoMedio = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
        }

        // Taxa de entregas no prazo
        let taxaNoPrazo = 0;
        const comPrazo = ticketsConcluidos.filter(t => t.data_previsao);
        if (comPrazo.length > 0) {
          const noPrazo = comPrazo.filter(t => {
            if (!t.data_entrega || !t.data_previsao) return false;
            return parseISO(t.data_entrega) <= parseISO(t.data_previsao);
          });
          taxaNoPrazo = Math.round((noPrazo.length / comPrazo.length) * 100);
        }

        membros.push({
          id: membro.id,
          nome: membro.nome,
          avatar_url: membro.avatar_url,
          emProducao,
          aguardando,
          revisao,
          concluidos,
          tempoMedio,
          taxaNoPrazo,
          totalTickets: membro.tickets.length
        });
      });

      // Ordenar por total de tickets em andamento (maior carga primeiro)
      membros.sort((a, b) => (b.emProducao + b.aguardando + b.revisao) - (a.emProducao + a.aguardando + a.revisao));

      // Calcular KPIs gerais
      const totalEmProducao = membros.reduce((sum, m) => sum + m.emProducao, 0);
      const totalConcluidos = membros.reduce((sum, m) => sum + m.concluidos, 0);
      
      const temposMembros = membros.filter(m => m.tempoMedio !== null).map(m => m.tempoMedio!);
      const tempoMedioGeral = temposMembros.length > 0 
        ? Math.round(temposMembros.reduce((a, b) => a + b, 0) / temposMembros.length)
        : null;

      const taxasMembros = membros.filter(m => m.concluidos > 0);
      const taxaNoPrazoGeral = taxasMembros.length > 0
        ? Math.round(taxasMembros.reduce((sum, m) => sum + m.taxaNoPrazo, 0) / taxasMembros.length)
        : 0;

      // Tickets recentes (últimas entregas)
      const ticketsRecentes = tickets
        ?.filter(t => t.status === 'concluido' && t.data_entrega)
        .sort((a, b) => new Date(b.data_entrega!).getTime() - new Date(a.data_entrega!).getTime())
        .slice(0, 10)
        .map(t => {
          const supervisor = t.supervisor as { id: string; full_name: string } | null;
          return {
            id: t.id,
            codigo: t.codigo,
            titulo: t.titulo,
            status: t.status,
            supervisor_id: t.supervisor_id!,
            supervisor_nome: supervisor?.full_name || 'N/A',
            data_entrega: t.data_entrega,
            data_previsao: t.data_previsao,
            categoria: t.categoria
          };
        }) || [];

      return {
        membros,
        kpis: {
          totalMembros: membros.length,
          totalEmProducao,
          totalConcluidos,
          tempoMedioGeral,
          taxaNoPrazoGeral
        },
        ticketsRecentes
      };
    },
    staleTime: 30000,
    refetchInterval: 60000
  });
}
