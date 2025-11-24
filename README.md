# Bot Discord - JavaScript

Repository ini berisi source code **Bot Discord** yang dibuat dengan bahasa **JavaScript** untuk membantu automasi dan pengelolaan server Discord Anda.

## Fitur Utama

- **Moderasi Otomatis:**  
  Bot dapat mengelola perilaku anggota secara otomatis sesuai aturan server.
- **Custom Command:**  
  Mendukung penambahan perintah khusus sesuai kebutuhan server.
- **Notifikasi & Event:**  
  Mengirim pesan otomatis seperti ucapan selamat datang, pengumuman, serta pengingat event.
- **Integrasi API:**  
  Dapat mengambil data dari API eksternal dan menampilkannya di server Discord.

## Daftar Fitur/Command Berdasarkan Plugin

Bot ini memiliki banyak fitur yang bisa diakses melalui command berikut (terintegrasi lewat plugin):

| Nama Plugin                | Command/Fungsi            | Deskripsi Singkat                                                   |
|----------------------------|---------------------------|---------------------------------------------------------------------|
| acc-etc.js                 | (otomatis/utility)        | Fitur terkait akun dan data pengguna lainnya.                       |
| campaign-create.js         | !campaign-create          | Membuat campaign baru di Discord.                                   |
| campaign-edit.js           | !campaign-edit            | Mengedit campaign yang telah dibuat sebelumnya.                     |
| check-campaign.js          | !check-campaign           | Mengecek status atau detail campaign tertentu.                      |
| list-campaigns.js          | !list-campaigns           | Melihat daftar seluruh campaign yang tersedia.                      |
| myaccount.js               | !myaccount                | Melihat atau mengatur data akun milik user.                         |
| mycampaign.js              | !mycampaign               | Melihat/mengelola campaign milik pengguna.                          |
| ping.js                    | !ping                     | Mengecek status/server bot, apakah online/responsif.                |
| register.js                | !register                 | Registrasi akun ke database bot.                                    |
| reject.js                  | !reject                   | Menolak/batalkan registrasi atau campaign.                          |
| resetdb.js                 | !resetdb                  | Mereset database bot secara menyeluruh.                             |
| set-announcement-channel.js| !set-announcement-channel | Mengatur channel untuk pengumuman otomatis dari bot.                |
| setTiktok.js               | !setTiktok                | Mengatur data/integrasi pengumuman TikTok.                          |
| submit-here.js             | !submit-here              | Submit data atau campaign di channel tertentu.                      |
| tiktok.js                  | !tiktok                   | Fitur interaksi/link/video TikTok di server.                        |
| unset.js                   | !unset                    | Menghapus atau reset pengaturan (misal: channel announcement).      |
| view-campaigns.js          | !view-campaigns           | Melihat detail atau laporan campaign yang terdaftar.                |

> *Catatan: Command/fungsi bisa berbeda penamaan di dalam bot, penjelasan di atas berdasarkan nama file dan fungsi umumnya.*

## Cara Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/callmezext/bot-discord.git
   ```
2. **Install dependencies**
   Pastikan sudah terinstall [Node.js](https://nodejs.org/).
   ```bash
   npm install
   ```
3. **Konfigurasi Bot**  
   Edit file `config.json` di root project dan sesuaikan data bot kamu.  
   Berikut penjelasan isi dan contoh file `config.json`:

   ```json
   {
     "token": "TOKEN_BOT_DISCORD_KAMU",
     "clientId": "CLIENT_ID_DISCORD_KAMU",
     "guildId": "GUILD_ID_SERVER_KAMU",
     "apiKey": "API_KEY_JIKA_ADA"
   }
   ```
   - `token` : Token Bot Discord, didapat dari Discord Developer Portal.
   - `clientId` : Client ID aplikasi Discord.
   - `guildId` : ID server/guild Discord yang ingin dipakai bot.
   - `apiKey` : Kunci API eksternal (opsional, isi jika memakai integrasi API).

## Cara Deploy Command Bot Discord

Agar perintah (commands) bot dapat terdaftar di Discord, Anda perlu melakukan deploy command. Biasanya ada script seperti `deploy-commands.js`.  
Berikut langkah-langkahnya:

1. Pastikan field `token`, `clientId`, dan `guildId` pada `config.json` sudah terisi valid.
2. Jalankan script deploy dengan Node.js:

   ```bash
   node deploy-commands.js
   ```

   Script ini akan mendaftarkan seluruh command bot ke aplikasi Discord Anda (sesuai server/guild yang sudah Anda daftarkan).

3. Jika berhasil, command bot akan muncul dan bisa digunakan di Discord server Anda.

> **Catatan:** Jika Anda menambah atau mengubah command, jalankan proses deploy ini kembali agar command terbaru terupdate di server Discord.

## Menjalankan Bot

Setelah deploy command, Anda jalankan bot seperti biasa:

```bash
npm start
```

## Struktur Kode

- Seluruh kode menggunakan **JavaScript**.
- Pengaturan utama bot ada pada file `config.json`.
- File fungsi utama, command, serta modul lain diatur dalam folder sesuai fungsinya (`commands/`, `features/`, `plugin/`, `utils/`, dll).

## Kontribusi

Kontribusi sangat terbuka, baik penambahan fitur, perbaikan bug, maupun peningkatan kode.
Silakan fork, modifikasi sesuai kebutuhan, lalu ajukan pull request.

## Lisensi

Proyek ini menggunakan lisensi MIT, silakan gunakan dan modifikasi proyek ini secara bebas.

---

Untuk pertanyaan, kritik, maupun saran, silakan buat issue di repository ini.
