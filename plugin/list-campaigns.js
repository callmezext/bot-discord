// File: plugin/list-campaigns.js (Diperbarui dengan Cover Image)
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list-campaigns")
    .setDescription("Menampilkan semua campaign yang sedang aktif saat ini."),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const db = await readDatabase();
    const allCampaigns = Object.values(db.dataCampaigns);
    const activeCampaigns = allCampaigns.filter(
      (campaign) => campaign.isActive
    );

    if (activeCampaigns.length === 0) {
      await interaction.editReply(
        "Saat ini belum ada campaign yang aktif. Coba cek lagi nanti!"
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Daftar Campaign Aktif 🎵")
      .setDescription("Gunakan `/submit-here` untuk berpartisipasi!")
      .setTimestamp();

    const campaignsToShow = activeCampaigns.slice(0, 25);

    for (const campaign of campaignsToShow) {
      let rateInfo = "";
      if (campaign.payoutType === "view") {
        rateInfo = `**Rate:** $${campaign.ratePer1mViews} / 1 Juta Views (Dinamis)`;
      } else if (campaign.payoutType === "submission") {
        rateInfo = `**Payout:** $${campaign.payoutPerSubmission} / Video (Tetap)`;
      }

      // Buat embed baru untuk setiap campaign agar bisa pakai thumbnail
      const campaignEmbed = new EmbedBuilder()
        .setColor(0x0099ff) // Warna biru untuk tiap campaign
        .setTitle(`🎵 ${campaign.title}`)
        .setDescription(
          `**Budget Tersisa:** $${campaign.budgetRemaining.toLocaleString(
            "id-ID"
          )}\n` +
            `${rateInfo}\n` +
            `**Min. Likes:** ${
              campaign.minLike > 0
                ? campaign.minLike.toLocaleString("id-ID")
                : "Tidak ada"
            }\n` +
            `**Link Musik:** [Klik di sini](${campaign.musicLink})\n` +
            `*ID: \`${campaign.id}\`*`
        );

      if (campaign.coverImageLink) {
        // <-- BARU: Tambah thumbnail jika ada
        campaignEmbed.setThumbnail(campaign.coverImageLink);
      }

      // Tambahkan embed campaign ke replies
      await interaction.channel.send({ embeds: [campaignEmbed] });
      // Beri jeda agar tidak spam API Discord
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Hapus balasan deferReply awal agar tidak ada pesan kosong
    await interaction.deleteReply();
  },
};
