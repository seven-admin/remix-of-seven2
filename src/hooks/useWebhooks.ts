import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  evento: string;
  url: string;
  descricao: string | null;
  is_active: boolean;
  ultimo_disparo: string | null;
  ultimo_status: number | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookFormData {
  evento: string;
  url: string;
  descricao?: string;
  is_active?: boolean;
}

export const WEBHOOK_EVENTS = [
  { value: 'negociacao_criada', label: 'Negociação Criada' },
  { value: 'negociacao_fechada', label: 'Negociação Fechada (Sucesso)' },
  { value: 'negociacao_perdida', label: 'Negociação Perdida' },
  { value: 'contrato_gerado', label: 'Contrato Gerado' },
  { value: 'contrato_assinado', label: 'Contrato Assinado' },
  { value: 'assinatura_enviada', label: 'Assinatura Enviada (Webhook n8n)' },
  { value: 'reserva_criada', label: 'Reserva Criada' },
  { value: 'lead_convertido', label: 'Lead Convertido' },
  { value: 'briefing_triado', label: 'Briefing Triado' },
  // Novos eventos
  { value: 'atividade_criada_por_superadmin', label: 'Atividade Criada por Super Admin' },
  { value: 'meta_comercial_criada', label: 'Meta Comercial Criada' },
  { value: 'atividade_comentada', label: 'Atividade Comentada (Marketing / Forecast)' },
  // Atividades de Produção - status changes
  { value: 'ticket_aguardando_analise', label: 'Atividade de Produção - Aguardando Análise' },
  { value: 'ticket_em_producao', label: 'Atividade de Produção - Em Produção' },
  { value: 'ticket_revisao', label: 'Atividade de Produção - Revisão' },
  { value: 'ticket_aprovacao_cliente', label: 'Atividade de Produção - Aprovação Cliente' },
  { value: 'ticket_ajuste', label: 'Atividade de Produção - Ajuste' },
  { value: 'ticket_concluido', label: 'Atividade de Produção - Concluído' },
];

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Webhook[];
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .insert({
          evento: data.evento,
          url: data.url,
          descricao: data.descricao || null,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating webhook:', error);
      toast.error('Erro ao criar webhook');
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WebhookFormData> }) => {
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating webhook:', error);
      toast.error('Erro ao atualizar webhook');
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook excluído com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting webhook:', error);
      toast.error('Erro ao excluir webhook');
    },
  });
}
