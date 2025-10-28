// File: plugin/register.js (Diperbarui)
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription(
      "Mendaftarkan akun Discord Anda untuk menggunakan fitur bot."
    ),

  async execute(interaction) {
    const db = await readDatabase();
    const userId = interaction.user.id;

    if (db.dataUser[userId]) {
      await interaction.reply({
        content: "Anda sudah terdaftar! Anda bisa menggunakan semua fitur.",
        flags: 64,
      });
      return;
    }

    db.dataUser[userId] = {
      discordUsername: interaction.user.username,
      registeredAt: new Date().toISOString(),
      balance: 0, // <-- TAMBAHAN BARU
      tiktokVerified: false,
      tiktokUsername: null,
      tiktokVerification: null,
    };

    await writeDatabase(db);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Registrasi Berhasil!")
      .setDescription(
        `Selamat datang, ${interaction.user.username}!\n\nAkun Anda telah terdaftar. Anda sekarang dapat menggunakan semua fitur bot.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};
