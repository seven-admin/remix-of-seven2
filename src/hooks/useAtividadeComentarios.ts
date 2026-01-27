import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AtividadeComentario } from '@/types/atividades.types';

export function useAtividadeComentarios(atividadeId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['atividade-comentarios', atividadeId],
    queryFn: async (): Promise<AtividadeComentario[]> => {
      if (!atividadeId) return [];
      
      const { data, error } = await supabase
        .from('atividade_comentarios')
        .select(`*, user:profiles(id, full_name, avatar_url)`)
        .eq('atividade_id', atividadeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as AtividadeComentario[];
    },
    enabled: !!atividadeId,
  });

  const createComentario = useMutation({
    mutationFn: async (comentario: string) => {
      if (!atividadeId) throw new Error('Atividade ID é obrigatório');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('atividade_comentarios')
        .insert({
          atividade_id: atividadeId,
          user_id: user.id,
          comentario: comentario.trim(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-comentarios', atividadeId] });
      toast.success('Comentário adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  return { comentarios: comentarios || [], isLoading, createComentario };
}
