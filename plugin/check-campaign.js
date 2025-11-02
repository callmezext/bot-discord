// File: plugin/check-campaign.js (BARU)

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { readDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-campaign")
    .setDescription(
      "Melihat daftar submission untuk sebuah campaign. (Mod Only)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("campaign_id")
        .setDescription("ID Campaign yang akan dicek.")
        .setRequired(true)
        .setAutocomplete(true)
    ), // <-- Autocomplete dari campaign-edit

  // Pinjam autocomplete dari campaign-edit
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      const db = await readDatabase();
      // Tampilkan semua campaign (aktif dan nonaktif) untuk pengecekan
      const campaigns = Object.values(db.dataCampaigns);
      const filtered = campaigns
        .filter(
          (campaign) =>
            campaign.title.toLowerCase().includes(focusedValue.toLowerCase()) ||
            campaign.id.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);
      await interaction.respond(
        filtered.map((campaign) => ({
          name: `(${campaign.isActive ? "Aktif" : "Nonaktif"}) ${
            campaign.title
          } [${campaign.id}]`,
          value: campaign.id,
        }))
      );
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      const db = await readDatabase();
      const campaignId = interaction.options.getString("campaign_id");
      const campaign = db.dataCampaigns[campaignId];

      if (!campaign) {
        await interaction.editReply(
          "❌ Campaign dengan ID tersebut tidak ditemukan."
        );
        return;
      }

      if (!campaign.submissions || campaign.submissions.length === 0) {
        await interaction.editReply(
          `Tidak ada submission untuk campaign "${campaign.title}".`
        );
        return;
      }

      // Kelompokkan submission berdasarkan userId
      const submissionsByUser = campaign.submissions.reduce((acc, sub) => {
        if (!acc[sub.userId]) {
          acc[sub.userId] = [];
        }
        acc[sub.userId].push(sub);
        return acc;
      }, {});

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Submissions untuk Campaign: ${campaign.title}`)
        .setDescription(`Total Submissions: ${campaign.submissions.length}`)
        .setTimestamp();

      let fieldCount = 0;
      const embedsToSend = [embed]; // Mulai dengan embed utama

      for (const userId in submissionsByUser) {
        if (fieldCount >= 24) {
          // Batas field per embed (sisakan 1 untuk user berikutnya)
          embedsToSend.push(new EmbedBuilder().setColor(0x0099ff)); // Buat embed baru jika penuh
          fieldCount = 0;
        }

        const user = await interaction.guild.members
          .fetch(userId)
          .catch(() => null); // Coba fetch user
        const username = user ? user.user.username : `User ID: ${userId}`;
        const userSubmissions = submissionsByUser[userId];

        let submissionList = userSubmissions
          .map(
            (sub) =>
              `[${sub.submissionId}](${sub.videoUrl}) - ${
                sub.status
              } | Views: ${sub.currentViews.toLocaleString()} | Likes: ${sub.currentLikes.toLocaleString()} | Earn: $${sub.totalEarnings.toFixed(
                2
              )}`
          )
          .join("\n");

        if (submissionList.length > 1024) {
          submissionList = submissionList.substring(0, 1020) + "..."; // Potong jika terlalu panjang
        }

        embedsToSend[embedsToSend.length - 1].addFields({
          // Tambahkan ke embed terakhir
          name: `👤 ${username}`,
          value: submissionList || "Tidak ada submission.",
        });
        fieldCount++;
      }

      // Kirim semua embed
      await interaction.editReply({ embeds: [embedsToSend.shift()] }); // Kirim embed pertama via editReply
      for (const followUpEmbed of embedsToSend) {
        await interaction.followUp({ embeds: [followUpEmbed], flags: 64 }); // Kirim sisanya via followUp
      }
    } catch (error) {
      console.error("Check campaign error:", error);
      await interaction.editReply("Terjadi error saat memeriksa campaign.");
    }
  },
};
