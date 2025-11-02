// File: plugin/view-campaigns.js (Perbaikan Final)

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

    // 1. Cek apakah channel pengumuman sudah diatur
    const channelId = db.botSettings.announcementChannelId;
    if (!channelId) {
      await interaction.editReply({
        content:
          "❌ Channel pengumuman belum diatur. Silakan gunakan `/set-announcement-channel` terlebih dahulu.",
      });
      return; // Hentikan jika belum diatur
    }

    // 2. Coba ambil channel-nya (BLOK INI YANG PENTING DIPERBAIKI)
    let announcementChannel;
    try {
      // Fetch channel dari cache atau API Discord
      announcementChannel = await interaction.guild.channels.fetch(channelId);

      // Validasi apakah channel ditemukan DAN merupakan channel teks
      if (!announcementChannel || !announcementChannel.isTextBased()) {
        // Jika tidak valid, lempar error agar ditangkap oleh 'catch'
        throw new Error("Channel tidak ditemukan atau bukan channel teks.");
      }
    } catch (error) {
      // Tangkap error jika fetch gagal ATAU jika validasi di atas gagal
      console.error("Gagal fetch/validate announcement channel:", error);
      await interaction.editReply({
        content: `❌ Gagal menemukan/mengakses channel pengumuman (ID: \`${channelId}\`). Pastikan channel ada, bot punya akses, dan itu adalah channel teks. Atur ulang dengan \`/set-announcement-channel\`.`,
      });
      return; // Hentikan eksekusi jika channel bermasalah
    }

    // 3. Ambil semua campaign yang 'isActive'
    const allCampaigns = Object.values(db.dataCampaigns);
    const activeCampaigns = allCampaigns.filter(
      (campaign) => campaign.isActive
    );

    // 4. Cek jika tidak ada campaign aktif
    if (activeCampaigns.length === 0) {
      await interaction.editReply(
        "Saat ini belum ada campaign yang aktif untuk diumumkan."
      );
      return; // Hentikan jika tidak ada campaign
    }

    // 5. Kirim Embed ke channel pengumuman (Loop ini sekarang aman)
    let successfullySentCount = 0;
    for (const campaign of activeCampaigns) {
      let rateInfo = "";
      if (campaign.payoutType === "view") {
        rateInfo = `**Rate:** $${campaign.ratePer1mViews} / 1 Juta Views (Dinamis)`;
      } else if (campaign.payoutType === "submission") {
        rateInfo = `**Payout:** $${campaign.payoutPerSubmission} / Video (Tetap)`;
      }

      const campaignEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
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
        campaignEmbed.setThumbnail(campaign.coverImageLink);
      }
      try {
        // Kirim embed ke channel yang sudah divalidasi
        await announcementChannel.send({ embeds: [campaignEmbed] }); // <-- Baris 79 (sekarang aman)
        successfullySentCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Jeda
      } catch (sendError) {
        console.error(
          `Gagal mengirim campaign ${campaign.id} ke channel pengumuman:`,
          sendError
        );
        // Beri tahu admin via followUp, tapi JANGAN return, lanjutkan loop
        await interaction
          .followUp({
            content: `⚠️ Gagal mengirim campaign ${campaign.id} ke ${announcementChannel}. Error: ${sendError.message}. Pastikan bot punya izin.`,
            flags: 64,
          })
          .catch(console.error);
      }
    }

    // 6. Kirim konfirmasi akhir ke Admin/Mod
    await interaction.editReply({
      content: `✅ ${successfullySentCount} dari ${activeCampaigns.length} campaign aktif telah berhasil dikirim ke channel ${announcementChannel}.`,
    });
  },
};
