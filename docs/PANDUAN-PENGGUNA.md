# Panduan Pengguna — Kantin DWP

## A. Untuk Pembeli (Tanpa Perlu Akun)

1. Buka aplikasi Kantin DWP di browser
2. Cari atau pilih penjual/produk yang diinginkan — perhatikan badge kondisi penjual:
   - 🟢 **Siap Menerima Pesanan** — penjual santai, cocok dipesan
   - 🟡 **Ada Pesanan** — penjual sedang menangani beberapa pesanan
   - 🔴 **Sedang Ramai** — waktu tunggu mungkin lebih lama
   - ⚪ **Tutup** — penjual belum bisa menerima pesanan
3. Tambahkan produk ke keranjang (bisa dari beberapa penjual sekaligus)
4. Buka keranjang → **Lanjut ke Checkout**
5. Isi nama, nomor WhatsApp, alamat, dan catatan (opsional)
6. Pilih metode pembayaran: QRIS, Transfer Bank, atau COD
7. Klik **Buat Pesanan** — Anda akan diarahkan ke halaman status pesanan
8. Simpan tautan status pesanan untuk memantau progres secara realtime
9. Setelah pesanan selesai, Anda bisa **mengunduh nota (PDF)** dari halaman status

## B. Untuk Penjual

### Registrasi
1. Buka menu **Login/Daftar Penjual**
2. Klik **Daftar di sini**, isi email, kata sandi, nama, dan nama usaha
3. Tunggu verifikasi dari Admin (Anda akan bisa login setelah disetujui)

### Menggunakan Dashboard
1. Setelah login, **aktifkan notifikasi suara** dengan menekan tombol yang muncul — ini wajib dilakukan sekali karena browser memerlukan izin awal
2. Setiap ada pesanan baru masuk, akan muncul:
   - Bunyi notifikasi berulang (sampai Anda menekan "Tandai Dilihat")
   - Kartu pesanan bergaya tiket di bagian atas dashboard
3. Tekan **Terima & Proses** untuk mulai mengerjakan pesanan
4. Cetak nota lewat tombol **🖨️ Nota** pada daftar riwayat pesanan
5. Kelola produk di menu **Kelola Produk**: tambah, edit, atur stok, dan harga
6. Atur volume/mute notifikasi suara lewat tombol di pojok kanan atas dashboard

### Tips Notifikasi Suara
- Jika suara tidak terdengar, pastikan tombol "Aktifkan Notifikasi Suara" sudah ditekan (satu kali per sesi browser)
- Notifikasi tetap tampil sebagai pop-up browser jika Anda berpindah tab, asal aplikasi masih terbuka

## C. Untuk Admin

### Login
Buka menu **Login Admin**, masukkan email dan kata sandi yang telah didaftarkan oleh developer/administrator sistem (lihat `docs/PANDUAN-INSTALASI.md` bagian pembuatan akun admin).

### Verifikasi Penjual
1. Buka menu **Verifikasi Penjual**
2. Tinjau daftar penjual berstatus "Menunggu"
3. Klik **Setujui** atau **Tolak** (dengan catatan alasan)

### Monitoring
- **Dashboard**: ringkasan total penjual, produk, transaksi, dan omzet
- **Monitoring Pesanan**: lihat seluruh transaksi dari semua penjual secara realtime

### Laporan
1. Buka menu **Rekap Laporan**
2. Klik **Ekspor Excel** atau **Ekspor PDF** untuk mengunduh rekap transaksi

## D. Pertanyaan Umum

**Apakah pembeli wajib membuat akun?**
Tidak. Pembeli cukup mengisi data (nama, WhatsApp, alamat) saat checkout.

**Bagaimana jika saya kehilangan tautan status pesanan?**
Simpan nomor order dan nomor WhatsApp yang digunakan saat checkout — keduanya diperlukan untuk membuka kembali status pesanan.

**Kenapa harga produk lebih tinggi dari yang diinput penjual?**
Sistem menambahkan biaya operasional minimum (default Rp1.000) ke setiap produk, sesuai kebijakan aplikasi yang dapat diatur admin.
