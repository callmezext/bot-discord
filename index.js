// File: index.js (Diperbarui dengan Worker)
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const { token } = require("./config.json");
const fs = require("fs");
const path = require("path");

// --- TAMBAHAN BARU ---
// Impor Worker dari 'worker_threads'
const { Worker } = require("worker_threads");
// --------------------

// HAPUS 'readDatabase', 'writeDatabase', 'parseStats', 'axios' dari sini.
// Mereka tidak lagi dibutuhkan oleh file bot utama.

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// --- Command Handler (Tidak Berubah) ---
client.commands = new Collection();
const pluginPath = path.join(__dirname, "plugin");
const commandFiles = fs
  .readdirSync(pluginPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(pluginPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`[BOT UTAMA] [INFO] Memuat perintah: ${command.data.name}`);
  } else {
    console.log(
      `[BOT UTAMA] [PERINGATAN] Perintah di ${filePath} tidak valid.`
    );
  }
}
// ----------------------

// Event saat bot siap (Diperbarui)
client.once(Events.ClientReady, () => {
  console.log(`[BOT UTAMA] Bot sudah online! Login sebagai ${client.user.tag}`);

  // --- MULAI WORKER TERPISAH ---
  console.log("[BOT UTAMA] Memulai thread worker untuk background task...");
  // Membuat worker baru yang menjalankan file 'worker.js'
  const worker = new Worker(path.join(__dirname, "worker.js"));

  // (Opsional) Menerima log dari worker dan mencetaknya di konsol utama
  worker.on("message", (message) => {
    console.log(message); // Cetak log dari worker
  });
  worker.on("error", (error) => {
    console.error("[BOT UTAMA] Worker error:", error);
  });
  worker.on("exit", (code) => {
    if (code !== 0)
      console.error(`[BOT UTAMA] Worker berhenti dengan exit code ${code}`);
  });
  // --- BATAS WORKER ---
});

// --- MAIN INTERACTION HANDLER (Tidak Berubah) ---
client.on(Events.InteractionCreate, async (interaction) => {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      if (command.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (error) {
      console.error(error);
    }
    return;
  }
  // Slash Command
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        content: "Terjadi error saat menjalankan perintah ini!",
        flags: 64,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }
  // Button
  if (interaction.isButton()) {
    if (interaction.customId === "verify_tiktok_now") {
      console.log(`[BOT UTAMA] [INFO] Tombol 'verify_tiktok_now' diklik.`);
    }
    return;
  }
});

// --- SEMUA FUNGSI BACKGROUND TASK SEKARANG DIHAPUS DARI SINI ---
// async function updateAllCampaignStats() { ... } // (Sudah dipindah ke worker.js)
// function startCampaignMonitor() { ... } // (Sudah dipindah ke worker.js)

// Login bot
client.login(token);
