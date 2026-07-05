import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
let client = null;

if (!configured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Kantin DWP] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
    'Aplikasi berjalan dengan MOCK DATA untuk keperluan demo/preview UI. ' +
    'Isi berkas .env sesuai .env.example untuk menyambungkan ke Supabase sungguhan.'
  );
} else {
  try {
    // createClient() melempar exception SINKRON jika SUPABASE_URL tidak valid
    // (misal lupa "https://", ada spasi/kutip tambahan, dsb). Jika ini terjadi
    // tanpa try/catch, seluruh modul gagal dimuat dan aplikasi tampil blank
    // putih total. Maka kita tangkap di sini dan jatuh ke mode demo.
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  } catch (err) {
    configured = false;
    client = null;
    // eslint-disable-next-line no-console
    console.error(
      '[Kantin DWP] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak valid, ' +
      'aplikasi jatuh ke MOCK DATA. Periksa kembali nilainya di Vercel ' +
      '(URL harus diawali https:// dan tanpa spasi/kutip tambahan). Detail:',
      err
    );
  }
}

export const isSupabaseConfigured = configured;
export const supabase = client;
