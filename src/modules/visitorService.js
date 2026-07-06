import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { mockVisitorDailyRecap, mockVisitorSummary } from '../config/mockData.js';

/**
 * Ambil rekap kunjungan harian, terbaru dulu.
 * @param {number} days - jumlah hari terakhir yang ingin ditampilkan
 */
export async function fetchVisitorDailyRecap(days = 30) {
  if (!isSupabaseConfigured) return mockVisitorDailyRecap.slice(0, days);

  const { data, error } = await supabase
    .from('v_visitor_daily_recap')
    .select('*')
    .limit(days);
  if (error) throw error;
  return data;
}

/** Ambil kartu ringkasan: pengunjung hari ini, 7 hari, bulan ini, total. */
export async function fetchVisitorSummary() {
  if (!isSupabaseConfigured) return mockVisitorSummary;

  const { data, error } = await supabase.from('v_visitor_summary').select('*').single();
  if (error) throw error;
  return data;
}
