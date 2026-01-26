import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Authorization header missing')
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token || token === 'undefined' || token === 'null') {
      console.error('Invalid token:', token)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Validating token...')
    
    // Use admin client to get user from token
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('Auth error:', authError.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const caller = userData?.user
    if (!caller) {
      console.error('No user found in token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', caller.id, caller.email)

    // Check if caller is admin or super_admin (using role_id + roles table)
    const { data: callerRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles!inner(name)')
      .eq('user_id', caller.id)
      .single()

    if (roleError) {
      console.error('Error fetching role:', roleError)
    }

    const callerRoleName = (callerRoleData?.roles as any)?.name
    if (!callerRoleName || !['admin', 'super_admin'].includes(callerRoleName)) {
      console.error('Caller is not admin:', callerRoleName)
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, full_name, phone, role, is_active = true, tipo_vinculo = 'terceiro', cargo = null } = await req.json()

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, full_name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating user:', { email, full_name, role })

    // Default password - user should change on first login
    const defaultPassword = 'Seven@1234'

    // Create user in Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id
    console.log('User created in auth:', newUserId)

    // Update profile (created by trigger) with additional info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        phone: phone || null,
        is_active,
        tipo_vinculo,
        cargo: tipo_vinculo === 'funcionario_seven' ? cargo : null
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Get the role_id from the roles table based on role name
    const { data: roleData, error: roleQueryError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single()

    if (roleQueryError || !roleData) {
      console.error('Error finding role:', roleQueryError)
      return new Response(
        JSON.stringify({ error: 'Role not found: ' + role }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert user role with role_id only (enum column now optional)
    const { error: insertRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role_id: roleData.id
      })

    if (insertRoleError) {
      console.error('Error inserting role:', insertRoleError)
      return new Response(
        JSON.stringify({ error: 'User created but failed to assign role: ' + insertRoleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email
    })

    if (resetError) {
      console.log('Could not send reset email:', resetError)
    }

    console.log('User created successfully:', newUserId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        message: 'Usuário criado com sucesso. Senha inicial: Seven@1234 (alterar no primeiro acesso)'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
