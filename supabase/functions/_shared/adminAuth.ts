export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Memverifikasi bahwa pemanggil (lewat header Authorization) benar-benar
 * login dan berrole 'superadmin'. Mengembalikan { adminClient, callerUser }
 * kalau valid, atau melempar Response error kalau tidak.
 */
export async function requireSuperadmin(req, createClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw json({ error: 'Unauthorized: tidak ada token.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !user) throw json({ error: 'Unauthorized: token tidak valid.' }, 401);

  // Client dengan service role, untuk cek role asli & operasi privileged.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: profileErr } = await adminClient
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single();
  if (profileErr || !callerProfile) throw json({ error: 'Profil pemanggil tidak ditemukan.' }, 403);

  const { data: roleRow } = await adminClient
    .from('roles')
    .select('name')
    .eq('id', callerProfile.role_id)
    .single();

  if (roleRow?.name !== 'superadmin') {
    throw json({ error: 'Hanya superadmin yang boleh melakukan aksi ini.' }, 403);
  }

  return { adminClient, callerUser: user };
}
