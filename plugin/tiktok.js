// File: plugin/tiktok.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const axios = require("axios");
const { readDatabase } = require("../db-handler.js"); // Impor untuk cek registrasi

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tiktok")
    .setDescription("Mendownload video TikTok tanpa watermark.")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("URL video TikTok yang ingin didownload.")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Cek Registrasi
    const db = await readDatabase();
    if (!db.dataUser[interaction.user.id]) {
      await interaction.reply({
        content:
          "Perintah ini khusus untuk pengguna terdaftar. Silakan gunakan `/register` terlebih dahulu.",
        flags: 64,
      });
      return;
    }

    await interaction.deferReply(); // Balasan publik
    const tiktokLink = interaction.options.getString("link");
    const API_ENDPOINT = "https://api.alyachan.dev/api/tiktok";
    const API_KEY = "aiscya";

    try {
      const response = await axios.get(API_ENDPOINT, {
        params: { url: tiktokLink, apikey: API_KEY },
      });
      const apiData = response.data;
      if (!apiData.status) {
        await interaction.editReply(
          "Gagal memproses link. Pastikan link TikTok valid."
        );
        return;
      }

      const authorName = apiData.author.nickname;
      const videoTitle = apiData.title.substring(0, 250);
      const noWatermarkData = apiData.data.find(
        (d) => d.type === "nowatermark" || d.type === "photo"
      );
      if (!noWatermarkData || !noWatermarkData.url) {
        await interaction.editReply(
          "Gagal menemukan link download No Watermark dari API."
        );
        return;
      }
      const downloadUrl = noWatermarkData.url;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({ name: `Video dari @${authorName}` })
        .setTitle(videoTitle)
        .setFooter({ text: `Dibuat oleh ${apiData.creator}` });
      const downloadButton = new ButtonBuilder()
        .setLabel("Download (No WM)")
        .setStyle(ButtonStyle.Link)
        .setURL(downloadUrl);
      const row = new ActionRowBuilder().addComponents(downloadButton);

      await interaction.editReply({
        content: "Berikut adalah hasil videonya:",
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("Error saat memanggil API TikTok:", error.message);
      await interaction.editReply(
        "Maaf, terjadi error. API mungkin sedang down atau link tidak valid."
      );
    }
  },
};
