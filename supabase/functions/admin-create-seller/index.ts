import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, requireSuperadmin } from '../_shared/adminAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireSuperadmin(req, createClient);

    const { username, email, password, fullName, businessName } = await req.json();
    if (!username || !email || !password || !fullName || !businessName) {
      return json({ error: 'Data tidak lengkap: username, email, password, fullName, businessName wajib diisi.' }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: 'Password minimal 6 karakter.' }, 400);
    }

    // Buat akun Auth langsung (email_confirm: true -> tidak perlu verifikasi email,
    // karena superadmin yang membuatkan, bukan self sign-up).
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return json({ error: `Gagal membuat akun: ${createErr.message}` }, 400);

    const newUserId = created.user.id;

    const { data: sellerRole, error: roleErr } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'seller')
      .single();
    if (roleErr) return json({ error: `Gagal mengambil role seller: ${roleErr.message}` }, 500);

    // Upsert karena trigger on_auth_user_created mungkin sudah membuat baris dasar.
    const { error: upsertErr } = await adminClient.from('users').upsert({
      id: newUserId,
      role_id: sellerRole.id,
      full_name: fullName,
      email,
      username,
    });
    if (upsertErr) return json({ error: `Gagal menyimpan profil: ${upsertErr.message}` }, 400);

    // Dibuat langsung oleh superadmin -> langsung approved (tidak perlu antre verifikasi).
    const { error: sellerErr } = await adminClient.from('sellers').insert({
      user_id: newUserId,
      business_name: businessName,
      verification_status: 'approved',
    });
    if (sellerErr) return json({ error: `Gagal membuat data toko: ${sellerErr.message}` }, 400);

    return json({ success: true, userId: newUserId });
  } catch (e) {
    if (e instanceof Response) return e; // dari requireSuperadmin
    return json({ error: e.message || String(e) }, 500);
  }
});
