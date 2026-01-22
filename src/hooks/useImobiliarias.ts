import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Imobiliaria, ImobiliariaFormData } from '@/types/mercado.types';
import { useToast } from '@/hooks/use-toast';

export function useImobiliarias() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: imobiliarias = [], isLoading, error } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: async (): Promise<Imobiliaria[]> => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      // Get corretores count for each imobiliaria
      const { data: corretores } = await supabase
        .from('corretores')
        .select('imobiliaria_id');
      
      const counts: Record<string, number> = {};
      corretores?.forEach(c => {
        if (c.imobiliaria_id) {
          counts[c.imobiliaria_id] = (counts[c.imobiliaria_id] || 0) + 1;
        }
      });
      
      return (data || []).map(imob => ({
        ...imob,
        corretores_count: counts[imob.id] || 0
      }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ImobiliariaFormData) => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .insert(formData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: ImobiliariaFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('delete-imobiliaria', {
        body: { imobiliaria_id: id },
      });

      if (error) throw error;

      // Edge functions may return { error } in the JSON body with 200 depending on handler.
      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      toast({ title: 'Imobiliária excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir imobiliária', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  return {
    imobiliarias,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Standalone hook to fetch a single imobiliaria
export function useImobiliaria(id: string | undefined) {
  return useQuery({
    queryKey: ['imobiliaria', id],
    queryFn: async (): Promise<Imobiliaria | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
}

// Paginated hook for imobiliarias
export function useImobiliariasPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ['imobiliarias-paginated', page, pageSize, search],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('imobiliarias')
        .select('*', { count: 'exact' })
        .order('nome')
        .range(from, to);

      if (search) {
        query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,endereco_cidade.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Get corretores count for each imobiliaria
      const { data: corretores } = await supabase
        .from('corretores')
        .select('imobiliaria_id');

      const counts: Record<string, number> = {};
      corretores?.forEach(c => {
        if (c.imobiliaria_id) {
          counts[c.imobiliaria_id] = (counts[c.imobiliaria_id] || 0) + 1;
        }
      });

      const imobiliarias = (data || []).map(imob => ({
        ...imob,
        corretores_count: counts[imob.id] || 0
      }));

      return {
        imobiliarias,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }
  });
}
