import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  evento: string
  dados: Record<string, unknown>
}

interface WebhookRecord {
  id: string
  evento: string
  url: string
  descricao: string | null
  ativo: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: WebhookPayload = await req.json()
    const { evento, dados } = payload

    console.log(`[webhook-dispatcher] Recebido evento: ${evento}`)
    console.log(`[webhook-dispatcher] Dados:`, JSON.stringify(dados, null, 2))

    if (!evento) {
      return new Response(
        JSON.stringify({ error: 'Evento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar webhooks ativos para este evento
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('evento', evento)
      .eq('is_active', true)

    if (webhooksError) {
      console.error('[webhook-dispatcher] Erro ao buscar webhooks:', webhooksError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar webhooks', details: webhooksError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`[webhook-dispatcher] Nenhum webhook ativo encontrado para o evento: ${evento}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum webhook configurado para este evento',
          disparos: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[webhook-dispatcher] Encontrados ${webhooks.length} webhook(s) para disparar`)

    const resultados: Array<{ webhook_id: string; url: string; sucesso: boolean; status?: number; erro?: string }> = []

    // Disparar para cada webhook
    for (const webhook of webhooks as WebhookRecord[]) {
      console.log(`[webhook-dispatcher] Disparando para: ${webhook.url}`)
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evento,
            timestamp: new Date().toISOString(),
            dados
          }),
        })

        const sucesso = response.ok
        const statusCode = response.status

        console.log(`[webhook-dispatcher] Resposta de ${webhook.url}: ${statusCode}`)

        // Atualizar último disparo no banco
        await supabase
          .from('webhooks')
          .update({
            ultimo_disparo: new Date().toISOString(),
            ultimo_status: sucesso ? 'sucesso' : `erro_${statusCode}`
          })
          .eq('id', webhook.id)

        resultados.push({
          webhook_id: webhook.id,
          url: webhook.url,
          sucesso,
          status: statusCode
        })
      } catch (fetchError) {
        console.error(`[webhook-dispatcher] Erro ao disparar para ${webhook.url}:`, fetchError)
        
        // Atualizar com erro
        await supabase
          .from('webhooks')
          .update({
            ultimo_disparo: new Date().toISOString(),
            ultimo_status: 'erro_conexao'
          })
          .eq('id', webhook.id)

        resultados.push({
          webhook_id: webhook.id,
          url: webhook.url,
          sucesso: false,
          erro: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'
        })
      }
    }

    const sucessos = resultados.filter(r => r.sucesso).length
    const falhas = resultados.filter(r => !r.sucesso).length

    console.log(`[webhook-dispatcher] Resultado: ${sucessos} sucesso(s), ${falhas} falha(s)`)

    return new Response(
      JSON.stringify({
        success: true,
        evento,
        disparos: resultados.length,
        sucessos,
        falhas,
        resultados
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[webhook-dispatcher] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
