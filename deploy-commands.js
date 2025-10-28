// File: deploy-commands.js (Dengan Deteksi Duplikat)

const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandNames = new Set(); // <-- TAMBAHAN: Set untuk melacak nama
const pluginPath = path.join(__dirname, "plugin");
const commandFiles = fs
  .readdirSync(pluginPath)
  .filter((file) => file.endsWith(".js"));

console.log(`[INFO] Membaca ${commandFiles.length} file perintah...`);

for (const file of commandFiles) {
  const filePath = path.join(pluginPath, file);
  try {
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      // --- DETEKTOR DUPLIKAT ---
      const commandName = command.data.name;
      if (commandNames.has(commandName)) {
        // Jika nama sudah ada di Set, hentikan proses dan beri tahu user
        console.error(
          `\n[ERROR FATAL] Nama perintah duplikat ditemukan: "/${commandName}"`
        );
        console.error(
          `File ini (${file}) mencoba menggunakan nama yang sudah dipakai.`
        );
        console.error(
          `Tolong perbaiki .setName() di salah satu file agar unik!`
        );
        process.exit(1); // Hentikan skrip
      }
      commandNames.add(commandName);
      // --- BATAS DETEKTOR ---

      commands.push(command.data.toJSON());
      // Log yang lebih baik:
      console.log(`[OK] Berhasil memuat: ${file} (Nama: /${commandName})`);
    } else {
      console.log(
        `[PERINGATAN] Perintah di ${filePath} tidak valid (kurang 'data' or 'execute').`
      );
    }
  } catch (error) {
    console.error(`[ERROR] Gagal memuat ${filePath}: ${error.message}`);
  }
}

// Inisialisasi REST
const rest = new REST({ version: "10" }).setToken(token);

// Proses pendaftaran
(async () => {
  try {
    console.log(`Mulai mendaftarkan ${commands.length} (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`Berhasil mendaftarkan ${data.length} (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
