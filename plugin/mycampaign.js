// File: plugin/mycampaign.js (BARU)

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mycampaign")
    .setDescription(
      "Menampilkan semua video yang telah Anda submit dan total pendapatan."
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const db = await readDatabase();
    const userId = interaction.user.id;

    // Cek registrasi
    if (!db.dataUser[userId]) {
      await interaction.editReply(
        "Anda belum terdaftar. Silakan gunakan `/register` terlebih dahulu."
      );
      return;
    }

    const mySubmissions = [];
    let grandTotalEarnings = 0;

    // Loop ke semua campaign untuk mencari submission milik user
    const allCampaigns = Object.values(db.dataCampaigns);
    for (const campaign of allCampaigns) {
      for (const submission of campaign.submissions) {
        if (submission.userId === userId) {
          // Ditemukan submission milik user
          mySubmissions.push({
            campaignTitle: campaign.title,
            videoUrl: submission.videoUrl,
            earnings: submission.totalEarnings || 0,
            status: submission.status,
            views: submission.currentViews || 0,
            likes: submission.currentLikes || 0,
          });
          grandTotalEarnings += submission.totalEarnings || 0;
        }
      }
    }

    if (mySubmissions.length === 0) {
      await interaction.editReply(
        "Anda belum men-submit video ke campaign mana pun. Gunakan `/list-campaigns` untuk memulai."
      );
      return;
    }

    // Buat Embed untuk menampilkan daftar
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Submission Milik: ${interaction.user.username}`)
      .setDescription(
        `Total pendapatan dari semua campaign: **$${grandTotalEarnings.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}**`
      )
      .setTimestamp();

    // Tambahkan setiap submission sebagai 'field'
    // Kita batasi 25 field
    const submissionsToShow = mySubmissions.slice(0, 25);

    for (const sub of submissionsToShow) {
      embed.addFields({
        name: `🎵 Campaign: ${sub.campaignTitle}`,
        value:
          `**Total Pendapatan:** $${sub.earnings.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}\n` +
          `**Views:** ${sub.views.toLocaleString("id-ID")}\n` +
          `**Likes:** ${sub.likes.toLocaleString("id-ID")}\n` +
          `**Link:** [Tonton Video](${sub.videoUrl})`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
