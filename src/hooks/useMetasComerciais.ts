import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns';

export interface MetaComercial {
  id: string;
  competencia: string;
  empreendimento_id: string | null;
  corretor_id: string | null;
  meta_valor: number;
  meta_unidades: number;
  meta_visitas: number;
  meta_atendimentos: number;
  meta_treinamentos: number;
  meta_propostas: number;
  created_at: string;
  updated_at: string;
}

// Pesos por etapa para cálculo de forecast ponderado
const ETAPA_PESOS: Record<string, number> = {
  lead: 0.10,
  atendimento: 0.20,
  visita: 0.35,
  negociacao: 0.65,
  fechado: 1.0,
  perdido: 0,
};

export function useMetasPorMes(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['metas-comerciais', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      const competenciaStr = format(startOfMonth(competencia), 'yyyy-MM-dd');
      
      let query = supabase
        .from('metas_comerciais' as any)
        .select('*')
        .eq('competencia', competenciaStr);
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      } else {
        query = query.is('empreendimento_id', null);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as MetaComercial | null;
    },
  });
}

export function useVendasRealizadasMes(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['vendas-realizadas', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      let query = supabase
        .from('contratos')
        .select('id, valor_contrato, data_assinatura, empreendimento_id')
        .eq('status', 'assinado')
        .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
        .lte('data_assinatura', format(fim, 'yyyy-MM-dd'));
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const totalValor = data?.reduce((sum, c) => sum + (c.valor_contrato || 0), 0) || 0;
      const totalUnidades = data?.length || 0;
      
      return { totalValor, totalUnidades, contratos: data };
    },
  });
}

export function useForecastFechamento(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['forecast-fechamento', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      let query = supabase
        .from('negociacoes')
        .select('id, valor_negociacao, etapa, data_previsao_fechamento, empreendimento_id, corretor_id')
        .not('etapa', 'in', '("fechado","perdido")');
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let valorBruto = 0;
      let valorPonderado = 0;
      let quantidadePipeline = 0;
      
      data?.forEach(neg => {
        const valor = neg.valor_negociacao || 0;
        const peso = ETAPA_PESOS[neg.etapa] || 0;
        
        valorBruto += valor;
        valorPonderado += valor * peso;
        quantidadePipeline++;
      });
      
      return { valorBruto, valorPonderado, quantidadePipeline, negociacoes: data };
    },
  });
}

export function useRankingCorretoresMes(competencia: Date, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['ranking-corretores-mes', format(competencia, 'yyyy-MM'), empreendimentoId],
    queryFn: async () => {
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      let query = supabase
        .from('contratos')
        .select(`
          id, 
          valor_contrato, 
          data_assinatura,
          corretor:corretores(id, nome_completo)
        `)
        .eq('status', 'assinado')
        .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
        .lte('data_assinatura', format(fim, 'yyyy-MM-dd'))
        .not('corretor_id', 'is', null);
      
      if (empreendimentoId) {
        query = query.eq('empreendimento_id', empreendimentoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Agregar por corretor
      const corretorMap = new Map<string, { nome: string; valor: number; unidades: number }>();
      
      data?.forEach(c => {
        const corretor = c.corretor as any;
        if (!corretor) return;
        
        const existing = corretorMap.get(corretor.id) || { nome: corretor.nome_completo, valor: 0, unidades: 0 };
        existing.valor += c.valor_contrato || 0;
        existing.unidades += 1;
        corretorMap.set(corretor.id, existing);
      });
      
      // Converter para array e ordenar
      const ranking = Array.from(corretorMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
      
      return ranking;
    },
  });
}

export function useHistoricoMetas(meses: number = 6, empreendimentoId?: string) {
  return useQuery({
    queryKey: ['historico-metas', meses, empreendimentoId],
    queryFn: async () => {
      const resultado: Array<{
        mes: string;
        mesLabel: string;
        meta: number;
        realizado: number;
      }> = [];
      
      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(new Date(), i);
        const competenciaStr = format(startOfMonth(data), 'yyyy-MM-dd');
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        
        // Buscar meta
        let metaQuery = supabase
          .from('metas_comerciais' as any)
          .select('meta_valor')
          .eq('competencia', competenciaStr);
        
        if (empreendimentoId) {
          metaQuery = metaQuery.eq('empreendimento_id', empreendimentoId);
        } else {
          metaQuery = metaQuery.is('empreendimento_id', null);
        }
        
        const { data: metaData } = await metaQuery.maybeSingle();
        
        // Buscar realizado
        let vendaQuery = supabase
          .from('contratos')
          .select('valor_contrato')
          .eq('status', 'assinado')
          .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
          .lte('data_assinatura', format(fim, 'yyyy-MM-dd'));
        
        if (empreendimentoId) {
          vendaQuery = vendaQuery.eq('empreendimento_id', empreendimentoId);
        }
        
        const { data: vendaData } = await vendaQuery;
        
        const realizado = vendaData?.reduce((sum, c) => sum + (c.valor_contrato || 0), 0) || 0;
        
        resultado.push({
          mes: format(data, 'yyyy-MM'),
          mesLabel: format(data, 'MMM/yy'),
          meta: (metaData as any)?.meta_valor || 0,
          realizado,
        });
      }
      
      return resultado;
    },
  });
}

export function useCreateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      competencia: string;
      empreendimento_id?: string | null;
      corretor_id?: string | null;
      meta_valor: number;
      meta_unidades: number;
      meta_visitas?: number;
      meta_atendimentos?: number;
      meta_treinamentos?: number;
      meta_propostas?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('metas_comerciais' as any)
        .upsert({
          competencia: data.competencia,
          empreendimento_id: data.empreendimento_id || null,
          corretor_id: data.corretor_id || null,
          meta_valor: data.meta_valor,
          meta_unidades: data.meta_unidades,
          meta_visitas: data.meta_visitas || 0,
          meta_atendimentos: data.meta_atendimentos || 0,
          meta_treinamentos: data.meta_treinamentos || 0,
          meta_propostas: data.meta_propostas || 0,
        }, {
          onConflict: 'competencia,empreendimento_id,corretor_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
    },
  });
}

export function useUpdateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MetaComercial> }) => {
      const { data: result, error } = await supabase
        .from('metas_comerciais' as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
    },
  });
}

export interface MetaComercialComEmpreendimento extends MetaComercial {
  empreendimento?: {
    id: string;
    nome: string;
  } | null;
}

export function useTodasMetas(anoFiltro?: number) {
  return useQuery({
    queryKey: ['todas-metas', anoFiltro],
    queryFn: async () => {
      let query = supabase
        .from('metas_comerciais' as any)
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .order('competencia', { ascending: false });
      
      if (anoFiltro) {
        query = query.gte('competencia', `${anoFiltro}-01-01`)
                    .lte('competencia', `${anoFiltro}-12-31`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as MetaComercialComEmpreendimento[];
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metas_comerciais' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
    },
  });
}

// Hook para buscar metas vs realizado por empreendimento
export function useMetasVsRealizadoPorEmpreendimento(competencia: Date) {
  return useQuery({
    queryKey: ['metas-vs-realizado-empreendimento', format(competencia, 'yyyy-MM')],
    queryFn: async () => {
      const competenciaStr = format(startOfMonth(competencia), 'yyyy-MM-dd');
      const inicio = startOfMonth(competencia);
      const fim = endOfMonth(competencia);
      
      // Buscar empreendimentos ativos
      const { data: empreendimentos } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .eq('is_active', true);
      
      const resultado: Array<{
        nome: string;
        meta: number;
        realizado: number;
        atingimento: number;
      }> = [];
      
      for (const emp of empreendimentos || []) {
        // Buscar meta do empreendimento
        const { data: metaData } = await supabase
          .from('metas_comerciais' as any)
          .select('meta_valor, meta_unidades')
          .eq('competencia', competenciaStr)
          .eq('empreendimento_id', emp.id)
          .maybeSingle();
        
        // Buscar vendas realizadas
        const { data: vendas } = await supabase
          .from('contratos')
          .select('valor_contrato')
          .eq('status', 'assinado')
          .eq('empreendimento_id', emp.id)
          .gte('data_assinatura', format(inicio, 'yyyy-MM-dd'))
          .lte('data_assinatura', format(fim, 'yyyy-MM-dd'));
        
        const realizado = vendas?.reduce((sum, c) => sum + (c.valor_contrato || 0), 0) || 0;
        const meta = (metaData as any)?.meta_valor || 0;
        
        if (meta > 0 || realizado > 0) {
          resultado.push({
            nome: emp.nome.length > 20 ? emp.nome.substring(0, 18) + '...' : emp.nome,
            meta,
            realizado,
            atingimento: meta > 0 ? (realizado / meta) * 100 : 0
          });
        }
      }
      
      return resultado.sort((a, b) => b.realizado - a.realizado);
    },
  });
}

// Hook para copiar metas entre meses
export function useCopiarMetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ origemCompetencia, destinoCompetencia }: {
      origemCompetencia: string;
      destinoCompetencia: string;
    }) => {
      // Buscar metas de origem
      const { data: metasOrigem, error: fetchError } = await supabase
        .from('metas_comerciais' as any)
        .select('*')
        .eq('competencia', origemCompetencia);
      
      if (fetchError) throw fetchError;
      if (!metasOrigem?.length) throw new Error('Nenhuma meta encontrada no mês de origem');
      
      const typedMetas = metasOrigem as unknown as MetaComercial[];
      
      // Criar metas no destino (upsert para não duplicar)
      for (const meta of typedMetas) {
        const { error } = await supabase
          .from('metas_comerciais' as any)
          .upsert({
            competencia: destinoCompetencia,
            empreendimento_id: meta.empreendimento_id,
            corretor_id: meta.corretor_id,
            meta_valor: meta.meta_valor,
            meta_unidades: meta.meta_unidades,
            meta_visitas: meta.meta_visitas || 0,
            meta_atendimentos: meta.meta_atendimentos || 0,
            meta_treinamentos: meta.meta_treinamentos || 0,
            meta_propostas: meta.meta_propostas || 0,
          }, {
            onConflict: 'competencia,empreendimento_id,corretor_id',
          });
        
        if (error) throw error;
      }
      
      return typedMetas.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-comerciais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-metas'] });
      queryClient.invalidateQueries({ queryKey: ['historico-metas'] });
    },
  });
}
