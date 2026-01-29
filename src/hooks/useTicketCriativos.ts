import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TicketCriativo } from '@/types/marketing.types';

const BUCKET_NAME = 'projetos-arquivos';

export function useTicketCriativos(projetoId: string) {
  const queryClient = useQueryClient();

  // Buscar criativos do projeto
  const { data: criativos = [], isLoading } = useQuery({
    queryKey: ['ticket-criativos', projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_criativos')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TicketCriativo[];
    },
    enabled: !!projetoId,
  });

  // Upload de arquivo
  const uploadCriativo = useMutation({
    mutationFn: async (file: File) => {
      // Determinar tipo
      const tipo = file.type.startsWith('video/') ? 'video' : 'imagem';
      
      // Gerar nome único
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${projetoId}/${fileName}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Inserir registro no banco
      const { data, error: insertError } = await supabase
        .from('ticket_criativos')
        .insert({
          projeto_id: projetoId,
          tipo,
          nome: file.name,
          url: filePath,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
      toast.success('Arquivo enviado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    },
  });

  // Deletar criativo
  const deleteCriativo = useMutation({
    mutationFn: async (criativo: TicketCriativo) => {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([criativo.url]);

      if (storageError) {
        console.warn('Erro ao remover arquivo do storage:', storageError);
      }

      // Remover registro do banco
      const { error } = await supabase
        .from('ticket_criativos')
        .delete()
        .eq('id', criativo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
      toast.success('Arquivo removido');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
    },
  });

  // Marcar como final
  const toggleFinal = useMutation({
    mutationFn: async ({ id, is_final }: { id: string; is_final: boolean }) => {
      const { error } = await supabase
        .from('ticket_criativos')
        .update({ is_final })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  // Obter URL assinada
  const getSignedUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hora

    if (error) {
      console.error('Erro ao gerar URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  return {
    criativos,
    isLoading,
    uploadCriativo,
    deleteCriativo,
    toggleFinal,
    getSignedUrl,
  };
}
