// Modul suara notifikasi pesanan masuk.
// Browser modern memblokir autoplay audio sebelum ada interaksi pengguna,
// jadi aplikasi meminta "Aktifkan Notifikasi Suara" saat penjual login pertama kali.

const STORAGE_KEY_MUTED = 'kantin_dwp_notif_muted';
const STORAGE_KEY_VOLUME = 'kantin_dwp_notif_volume';
const STORAGE_KEY_UNLOCKED = 'kantin_dwp_audio_unlocked';

let audioEl = null;
let isLooping = false;
let loopIntervalId = null;

function getAudioEl() {
  if (!audioEl) {
    audioEl = new Audio('/sounds/new-order-alert.mp3');
    audioEl.volume = getVolume();
  }
  return audioEl;
}

export function getVolume() {
  const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
  return stored !== null ? Number(stored) : 0.8;
}

export function setVolume(value) {
  localStorage.setItem(STORAGE_KEY_VOLUME, String(value));
  if (audioEl) audioEl.volume = value;
}

export function isMuted() {
  return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
}

export function setMuted(muted) {
  localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
  if (muted) stopAlertLoop();
}

export function isAudioUnlocked() {
  return sessionStorage.getItem(STORAGE_KEY_UNLOCKED) === 'true';
}

/**
 * Dipanggil dari tombol "Aktifkan Notifikasi Suara" (user gesture)
 * agar browser mengizinkan pemutaran audio otomatis setelahnya.
 */
export async function unlockAudio() {
  try {
    const el = getAudioEl();
    el.volume = 0;
    await el.play();
    el.pause();
    el.currentTime = 0;
    el.volume = getVolume();
    sessionStorage.setItem(STORAGE_KEY_UNLOCKED, 'true');
    return true;
  } catch (err) {
    console.warn('[audioAlert] Gagal unlock audio:', err.message);
    return false;
  }
}

/**
 * Memutar alert suara berulang (looping) hingga pesanan di-ack ("Tandai Dilihat")
 * atau di-mute manual oleh penjual.
 */
export function playAlertLoop() {
  if (isMuted() || isLooping) return;
  isLooping = true;

  const play = () => {
    const el = getAudioEl();
    el.currentTime = 0;
    el.play().catch((err) => console.warn('[audioAlert] Autoplay diblokir:', err.message));
  };

  play();
  loopIntervalId = setInterval(play, 4000); // ulangi tiap 4 detik selama belum di-ack
}

export function stopAlertLoop() {
  isLooping = false;
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
}

/**
 * Notifikasi browser (Web Notification API) sebagai pelengkap saat tab
 * penjual tidak fokus. Meminta izin hanya saat fitur diaktifkan penjual.
 */
export async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function showBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return; // hanya saat tab tidak aktif
  new Notification(title, { body, icon: '/icons/icon-192.png' });
}
