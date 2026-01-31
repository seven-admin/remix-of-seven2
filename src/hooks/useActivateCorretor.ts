import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActivateResult {
  empreendimentosVinculados: number;
}

export function useActivateCorretor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<ActivateResult> => {
      // 1. Ativar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Buscar todos empreendimentos ativos
      const { data: emps, error: empError } = await supabase
        .from('empreendimentos')
        .select('id')
        .eq('is_active', true);

      if (empError) throw empError;

      // 3. Verificar vínculos existentes para não duplicar
      const { data: existingLinks } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id')
        .eq('user_id', userId);

      const existingIds = new Set(existingLinks?.map(l => l.empreendimento_id) || []);

      // 4. Inserir apenas vínculos novos
      const newLinks = (emps || [])
        .filter(e => !existingIds.has(e.id))
        .map(e => ({
          user_id: userId,
          empreendimento_id: e.id
        }));

      if (newLinks.length > 0) {
        const { error: linkError } = await supabase
          .from('user_empreendimentos')
          .insert(newLinks);

        if (linkError) throw linkError;
      }

      return { empreendimentosVinculados: newLinks.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(`Corretor ativado e vinculado a ${data.empreendimentosVinculados} empreendimento(s)`);
    },
    onError: (error: Error) => {
      console.error('Error activating corretor:', error);
      toast.error('Erro ao ativar corretor: ' + error.message);
    }
  });
}

// Hook para ativação em lote
export function useBulkActivateCorretores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]): Promise<{ total: number; empreendimentos: number }> => {
      // Buscar empreendimentos ativos uma única vez
      const { data: emps, error: empError } = await supabase
        .from('empreendimentos')
        .select('id')
        .eq('is_active', true);

      if (empError) throw empError;

      let totalEmpsVinculados = 0;

      for (const userId of userIds) {
        // Ativar profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .eq('id', userId);

        if (profileError) {
          console.error(`Error activating user ${userId}:`, profileError);
          continue;
        }

        // Verificar vínculos existentes
        const { data: existingLinks } = await supabase
          .from('user_empreendimentos')
          .select('empreendimento_id')
          .eq('user_id', userId);

        const existingIds = new Set(existingLinks?.map(l => l.empreendimento_id) || []);

        // Inserir novos vínculos
        const newLinks = (emps || [])
          .filter(e => !existingIds.has(e.id))
          .map(e => ({
            user_id: userId,
            empreendimento_id: e.id
          }));

        if (newLinks.length > 0) {
          const { error: linkError } = await supabase
            .from('user_empreendimentos')
            .insert(newLinks);

          if (!linkError) {
            totalEmpsVinculados += newLinks.length;
          }
        }
      }

      return { total: userIds.length, empreendimentos: totalEmpsVinculados };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(`${data.total} corretor(es) ativado(s) com ${data.empreendimentos} vínculo(s) criado(s)`);
    },
    onError: (error: Error) => {
      console.error('Error bulk activating corretores:', error);
      toast.error('Erro ao ativar corretores: ' + error.message);
    }
  });
}
