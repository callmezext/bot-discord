// File: plugin/acc-etc.js (BARU)

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("acc-etc") // Nama mungkin perlu disesuaikan (accept-etc? accept-campaign?)
    .setDescription(
      "Menerima SEMUA submission pending di campaign SPESIFIK. (Mod Only)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("campaign_id")
        .setDescription("ID Campaign yang submissionnya akan diterima.")
        .setRequired(true)
        .setAutocomplete(true)
    ), // <-- Autocomplete

  // Pinjam autocomplete dari campaign-edit
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      const db = await readDatabase();
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

      let acceptedCount = 0;
      let totalPaidOut = 0;
      let errors = [];

      // Loop HANYA submission dalam campaign ini
      for (const submission of campaign.submissions) {
        if (submission.status === "pending") {
          const earningToPay = submission.totalEarnings || 0;
          const userToPay = db.dataUser[submission.userId];

          if (!userToPay) {
            errors.push(
              `User ${submission.userId} (Sub ID: ${submission.submissionId}) tidak ditemukan.`
            );
            continue;
          }

          if (campaign.budgetRemaining < earningToPay) {
            errors.push(
              `Budget campaign tidak cukup untuk membayar ${
                submission.submissionId
              } ($${earningToPay.toFixed(2)} needed). Submission dilewati.`
            );
            continue;
          }

          if (!userToPay.balance) userToPay.balance = 0;
          userToPay.balance += earningToPay;
          campaign.budgetRemaining -= earningToPay;
          submission.status = "accepted";

          acceptedCount++;
          totalPaidOut += earningToPay;
        }
      }

      if (acceptedCount === 0 && errors.length === 0) {
        await interaction.editReply(
          `Tidak ada submission pending yang ditemukan di campaign "${campaign.title}" untuk diterima.`
        );
        return;
      }

      await writeDatabase(db);

      let replyMessage =
        `✅ Berhasil menerima **${acceptedCount}** submission di campaign "${campaign.title}".\n` +
        `💰 Total dibayarkan: **$${totalPaidOut.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}**.\n` +
        `📉 Sisa Budget Campaign: **$${campaign.budgetRemaining.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}**.\n\n`;

      if (errors.length > 0) {
        replyMessage += `**⚠️ Terdapat ${errors.length} error:**\n- ${errors
          .slice(0, 5)
          .join("\n- ")}`;
        if (errors.length > 5)
          replyMessage += "\n- ... (dan error lainnya, cek log)";
      }

      await interaction.editReply(replyMessage);
    } catch (error) {
      console.error("Accept Etc error:", error);
      await interaction.editReply(
        "Terjadi error saat menerima submission campaign ini."
      );
    }
  },
};
