// File: plugin/view-campaigns.js (Diperbarui dengan Cover Image)

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { readDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view-campaigns")
    .setDescription(
      "Mengirim daftar campaign aktif ke channel pengumuman. (Mod/Admin Only)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const db = await readDatabase();

    const channelId = db.botSettings.announcementChannelId;
    if (!channelId) {
      /* ... (Logika Error Tetap Sama) ... */
    }
    let announcementChannel;
    try {
      /* ... (Logika Error Tetap Sama) ... */
    } catch (error) {
      /* ... */ return;
    }

    const allCampaigns = Object.values(db.dataCampaigns);
    const activeCampaigns = allCampaigns.filter(
      (campaign) => campaign.isActive
    );

    if (activeCampaigns.length === 0) {
      await interaction.editReply(
        "Saat ini belum ada campaign yang aktif untuk diumumkan."
      );
      return;
    }

    // Kirim setiap campaign sebagai embed terpisah ke channel pengumuman
    for (const campaign of activeCampaigns) {
      let rateInfo = "";
      if (campaign.payoutType === "view") {
        rateInfo = `**Rate:** $${campaign.ratePer1mViews} / 1 Juta Views (Dinamis)`;
      } else if (campaign.payoutType === "submission") {
        rateInfo = `**Payout:** $${campaign.payoutPerSubmission} / Video (Tetap)`;
      }

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

      // Kirim embed campaign ke channel pengumuman
      try {
        await announcementChannel.send({ embeds: [campaignEmbed] });
        // Beri jeda antar pesan agar tidak terlalu cepat
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (sendError) {
        console.error(
          `Gagal mengirim campaign ${campaign.id} ke channel pengumuman:`,
          sendError
        );
        // Lanjutkan ke campaign berikutnya meskipun ada error
      }
    }

    // Konfirmasi akhir ke Admin/Mod
    await interaction.editReply({
      content: `✅ Daftar campaign aktif telah berhasil dikirim ke channel ${announcementChannel}.`,
    });
  },
};
