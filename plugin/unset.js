// File: plugin/unset.js
const { SlashCommandBuilder } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unset")
    .setDescription("Melepaskan tautan akun TikTok dari profil Anda.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription(
          "Ketik username TikTok Anda (tanpa @) untuk konfirmasi."
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const db = await readDatabase();
    const userId = interaction.user.id;

    if (!db.dataUser[userId]) {
      await interaction.editReply({ content: "Anda belum terdaftar." });
      return;
    }
    const userData = db.dataUser[userId];
    if (!userData.tiktokVerified || !userData.tiktokUsername) {
      await interaction.editReply({
        content: "Anda tidak memiliki akun TikTok yang tertaut.",
      });
      return;
    }
    const inputUsername = interaction.options
      .getString("username")
      .replace("@", "");
    if (userData.tiktokUsername.toLowerCase() !== inputUsername.toLowerCase()) {
      await interaction.editReply({
        content: `❌ Gagal! Username (\`${inputUsername}\`) tidak cocok dengan (\`${userData.tiktokUsername}\`).`,
      });
      return;
    }

    userData.tiktokVerified = false;
    userData.tiktokUsername = null;
    userData.tiktokInfo = null;
    userData.tiktokVerification = null;
    await writeDatabase(db);
    await interaction.editReply({
      content: "✅ Berhasil! Tautan akun TikTok Anda telah dihapus.",
    });
  },
};
