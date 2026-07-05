import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, requireSuperadmin } from '../_shared/adminAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireSuperadmin(req, createClient);

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) {
      return json({ error: 'Data tidak lengkap: userId dan newPassword wajib diisi.' }, 400);
    }
    if (String(newPassword).length < 6) {
      return json({ error: 'Password minimal 6 karakter.' }, 400);
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) return json({ error: `Gagal reset password: ${error.message}` }, 400);

    return json({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: e.message || String(e) }, 500);
  }
});
