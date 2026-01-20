import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GestorProduto {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  percentual_comissao?: number | null;
}

export function useGestoresProduto() {
  return useQuery({
    queryKey: ['gestores-produto'],
    queryFn: async () => {
      // First get user_ids with role gestor_produto
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'gestor_produto');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        return [];
      }

      const userIds = roleData.map(r => r.user_id);

      // Then get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, percentual_comissao')
        .in('id', userIds)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      return (profiles || []) as GestorProduto[];
    }
  });
}

// Hook para buscar todos os gestores com percentual de comissão
export function useGestoresComPercentual() {
  return useQuery({
    queryKey: ['gestores-percentual'],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'gestor_produto');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        return [];
      }

      const userIds = roleData.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, percentual_comissao')
        .in('id', userIds)
        .order('full_name');

      if (profilesError) throw profilesError;

      return (profiles || []) as GestorProduto[];
    }
  });
}

// Hook para atualizar o percentual de comissão de um gestor
export function useUpdatePercentualGestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gestorId, percentual }: { gestorId: string; percentual: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ percentual_comissao: percentual })
        .eq('id', gestorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores-produto'] });
      queryClient.invalidateQueries({ queryKey: ['gestores-percentual'] });
      toast.success('Percentual de comissão atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar percentual: ${error.message}`);
    },
  });
}
