PENTING — Placeholder Berkas Suara Notifikasi
================================================

File audio biner (.mp3/.ogg) tidak dapat digenerate otomatis dalam paket kode ini.

Sebelum deploy ke produksi, ganti berkas ini dengan file suara notifikasi asli:

1. Simpan file dengan nama persis: new-order-alert.mp3
2. Letakkan di folder ini: public/sounds/new-order-alert.mp3
3. Rekomendasi: durasi pendek (1-2 detik), nada/bunyi khas & mudah dikenali
   (misalnya bunyi "bell kasir" atau "ting" yang berbeda dari notifikasi lain),
   format mp3 dengan bitrate rendah (~64-128kbps) agar ringan dimuat.
4. Sumber gratis (berlisensi bebas pakai) bisa dicari di: pixabay.com/sound-effects,
   freesound.org, atau mixkit.co/free-sound-effects — cari kata kunci
   "notification bell" atau "cash register bell".

Referensi di kode: src/modules/seller/notifications/audioAlert.js
