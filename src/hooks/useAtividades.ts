import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { invalidateDashboards } from '@/lib/invalidateDashboards';
import type { 
  Atividade, 
  AtividadeFormData, 
  AtividadeFilters, 
  ConcluirAtividadeData,
  ConfiguracoesAtividades,
} from '@/types/atividades.types';

export function useAtividades(filters?: AtividadeFilters) {
  return useQuery({
    queryKey: ['atividades', filters],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`
          *,
          cliente:clientes(id, nome, temperatura),
          corretor:corretores(id, nome_completo),
          imobiliaria:imobiliarias(id, nome),
          empreendimento:empreendimentos(id, nome),
          gestor:profiles(id, full_name)
        `)
        .order('data_hora', { ascending: true });

      if (filters?.tipo) query = query.eq('tipo', filters.tipo);
      if (filters?.categoria) query = query.eq('categoria', filters.categoria);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.gestor_id) query = query.eq('gestor_id', filters.gestor_id);
      if (filters?.empreendimento_id) query = query.eq('empreendimento_id', filters.empreendimento_id);
      if (filters?.cliente_id) query = query.eq('cliente_id', filters.cliente_id);
      if (filters?.data_inicio) query = query.gte('data_hora', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('data_hora', filters.data_fim);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

export function useAtividade(id: string | undefined) {
  return useQuery({
    queryKey: ['atividade', id],
    queryFn: async (): Promise<Atividade | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), imobiliaria:imobiliarias(id, nome), empreendimento:empreendimentos(id, nome), gestor:profiles(id, full_name)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Atividade;
    },
    enabled: !!id,
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: AtividadeFormData) => {
      const { data, error } = await supabase.from('atividades').insert(formData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar atividade'),
  });
}

// Hook para criar atividades em lote para múltiplos gestores
export function useCreateAtividadesParaGestores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ formData, gestorIds }: { formData: Omit<AtividadeFormData, 'gestor_id'>; gestorIds: string[] }) => {
      // Criar uma atividade para cada gestor
      const atividadesParaInserir = gestorIds.map(gestorId => ({
        ...formData,
        gestor_id: gestorId,
      }));

      const { data, error } = await supabase.from('atividades').insert(atividadesParaInserir).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success(`${data.length} atividade(s) criada(s) com sucesso!`);
    },
    onError: () => toast.error('Erro ao criar atividades para gestores'),
  });
}

export function useUpdateAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AtividadeFormData> }) => {
      const { data: result, error } = await supabase.from('atividades').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar atividade'),
  });
}

export function useConcluirAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConcluirAtividadeData }) => {
      const { data: result, error } = await supabase
        .from('atividades')
        .update({ status: 'concluida', resultado: data.resultado, temperatura_cliente: data.temperatura_cliente, requer_followup: data.requer_followup, data_followup: data.data_followup })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade concluída!');
    },
    onError: () => toast.error('Erro ao concluir atividade'),
  });
}

export function useConcluirAtividadesEmLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('atividades')
        .update({ status: 'concluida', resultado: 'Atividade concluída (lote)' })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      invalidateDashboards(queryClient);
      toast.success(`${ids.length} atividade(s) concluída(s)!`);
    },
    onError: () => toast.error('Erro ao concluir atividades em lote'),
  });
}

export function useCancelarAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atividades').update({ status: 'cancelada' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade cancelada!');
    },
    onError: () => toast.error('Erro ao cancelar atividade'),
  });
}

export function useDeleteAtividade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atividades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      invalidateDashboards(queryClient);
      toast.success('Atividade excluída!');
    },
    onError: () => toast.error('Erro ao excluir atividade'),
  });
}

export function useMarcarFollowupRealizado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('atividades')
        .update({ 
          requer_followup: false, 
          data_followup: null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-pendentes-followup'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-vencidas'] });
      invalidateDashboards(queryClient);
      toast.success('Follow-up marcado como realizado!');
    },
    onError: () => toast.error('Erro ao marcar follow-up'),
  });
}

export function useConfiguracoesAtividades() {
  return useQuery({
    queryKey: ['configuracoes-atividades'],
    queryFn: async (): Promise<ConfiguracoesAtividades | null> => {
      const { data, error } = await supabase.from('configuracoes_atividades' as any).select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as ConfiguracoesAtividades | null;
    },
  });
}

export function useAtividadesPendentesFollowup() {
  return useQuery({
    queryKey: ['atividades-pendentes-followup'],
    queryFn: async (): Promise<Atividade[]> => {
      const { data, error } = await supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo)`)
        .eq('requer_followup', true)
        .eq('status', 'concluida')
        .not('data_followup', 'is', null)
        .lte('data_followup', new Date().toISOString())
        .order('data_followup', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

// ============ AGENDA HOOKS (consolidados de useAgenda.ts) ============

export function useAgendaMensal(ano: number, mes: number, gestorId?: string) {
  const dataInicio = startOfMonth(new Date(ano, mes - 1));
  const dataFim = endOfMonth(new Date(ano, mes - 1));

  return useQuery({
    queryKey: ['agenda', 'mensal', ano, mes, gestorId],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), empreendimento:empreendimentos(id, nome)`)
        .gte('data_hora', dataInicio.toISOString())
        .lte('data_hora', dataFim.toISOString())
        .neq('status', 'cancelada')
        .order('data_hora', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

export function useAgendaDia(data: Date, gestorId?: string) {
  const dataStr = format(data, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['agenda', 'dia', dataStr, gestorId],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo), empreendimento:empreendimentos(id, nome)`)
        .gte('data_hora', `${dataStr}T00:00:00`)
        .lte('data_hora', `${dataStr}T23:59:59`)
        .neq('status', 'cancelada')
        .order('data_hora', { ascending: true });

      if (gestorId) query = query.eq('gestor_id', gestorId);

      const { data: result, error } = await query;
      if (error) throw error;
      return (result || []) as unknown as Atividade[];
    },
  });
}

export function useAtividadesHoje() {
  const hoje = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['agenda', 'hoje'],
    queryFn: async (): Promise<Atividade[]> => {
      const { data, error } = await supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo)`)
        .gte('data_hora', `${hoje}T00:00:00`)
        .lte('data_hora', `${hoje}T23:59:59`)
        .neq('status', 'cancelada')
        .order('data_hora', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}

export function useAtividadesVencidas() {
  return useQuery({
    queryKey: ['atividades-vencidas'],
    queryFn: async (): Promise<Atividade[]> => {
      const { data, error } = await supabase
        .from('atividades')
        .select(`*, cliente:clientes(id, nome, temperatura), corretor:corretores(id, nome_completo)`)
        .eq('status', 'pendente')
        .lt('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Atividade[];
    },
  });
}