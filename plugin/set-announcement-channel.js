// File: plugin/set-announcement-channel.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-announcement-channel")
    .setDescription(
      "Mengatur channel untuk pengumuman campaign baru. (Admin/Mod Only)"
    )
    // Izin ManageGuild lebih cocok untuk pengaturan bot
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel tujuan pengumuman.")
        .setRequired(true)
        // Hanya izinkan channel teks
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // Balasan privat

    try {
      const channel = interaction.options.getChannel("channel");
      const db = await readDatabase();

      // Pastikan botSettings ada (seharusnya sudah ada dari db-handler)
      if (!db.botSettings) db.botSettings = {};

      // Simpan ID channel
      db.botSettings.announcementChannelId = channel.id;
      await writeDatabase(db);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Channel Pengumuman Diatur!")
        .setDescription(
          `Oke! Semua pengumuman campaign baru akan dikirim ke ${channel}.`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error saat set announcement channel:", error);
      await interaction.editReply(
        "Terjadi error saat mencoba mengatur channel."
      );
    }
  },
};
