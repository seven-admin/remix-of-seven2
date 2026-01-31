import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActivateResult {
  empreendimentosVinculados: number;
}

interface ActivateCorretorParams {
  userId: string;
  email: string;
  nome: string;
  cpf?: string;
  creci?: string;
}

export function useActivateCorretor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ActivateCorretorParams): Promise<ActivateResult> => {
      const { userId, email, nome, cpf, creci } = params;

      // 1. Verificar se já existe registro em corretores
      const { data: existingCorretor } = await supabase
        .from('corretores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // 2. Se não existe, criar o registro na tabela corretores
      if (!existingCorretor) {
        const { error: corretorError } = await supabase
          .from('corretores')
          .insert({
            user_id: userId,
            email: email,
            nome_completo: nome,
            cpf: cpf?.replace(/\D/g, '') || null,
            creci: creci || null,
            is_active: true
          });

        if (corretorError) throw corretorError;
      }

      // 3. Ativar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 4. Buscar todos empreendimentos ativos
      const { data: emps, error: empError } = await supabase
        .from('empreendimentos')
        .select('id')
        .eq('is_active', true);

      if (empError) throw empError;

      // 5. Verificar vínculos existentes para não duplicar
      const { data: existingLinks } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id')
        .eq('user_id', userId);

      const existingIds = new Set(existingLinks?.map(l => l.empreendimento_id) || []);

      // 6. Inserir apenas vínculos novos
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
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['meu-corretor'] });
      toast.success(`Corretor ativado e vinculado a ${data.empreendimentosVinculados} empreendimento(s)`);
    },
    onError: (error: Error) => {
      console.error('Error activating corretor:', error);
      toast.error('Erro ao ativar corretor: ' + error.message);
    }
  });
}

interface BulkActivateParams {
  userId: string;
  email: string;
  nome: string;
}

// Hook para ativação em lote
export function useBulkActivateCorretores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: BulkActivateParams[]): Promise<{ total: number; empreendimentos: number }> => {
      // Buscar empreendimentos ativos uma única vez
      const { data: emps, error: empError } = await supabase
        .from('empreendimentos')
        .select('id')
        .eq('is_active', true);

      if (empError) throw empError;

      let totalEmpsVinculados = 0;

      for (const user of users) {
        const { userId, email, nome } = user;

        // Verificar se já existe registro em corretores
        const { data: existingCorretor } = await supabase
          .from('corretores')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        // Se não existe, criar o registro
        if (!existingCorretor) {
          const { error: corretorError } = await supabase
            .from('corretores')
            .insert({
              user_id: userId,
              email: email,
              nome_completo: nome,
              is_active: true
            });

          if (corretorError) {
            console.error(`Error creating corretor for user ${userId}:`, corretorError);
          }
        }

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

      return { total: users.length, empreendimentos: totalEmpsVinculados };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['meu-corretor'] });
      toast.success(`${data.total} corretor(es) ativado(s) com ${data.empreendimentos} vínculo(s) criado(s)`);
    },
    onError: (error: Error) => {
      console.error('Error bulk activating corretores:', error);
      toast.error('Erro ao ativar corretores: ' + error.message);
    }
  });
}
