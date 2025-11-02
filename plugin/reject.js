// File: plugin/reject.js (BARU)

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reject")
    .setDescription("Menolak submission video berdasarkan ID. (Mod Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("submission_id")
        .setDescription("ID Unik submission (cth: ZETT01). Case-insensitive.")
        .setRequired(true)
    )
    .addUserOption(
      (
        option // Opsional, untuk memastikan ID milik user yang benar
      ) =>
        option
          .setName("user")
          .setDescription("User pemilik submission (Opsional).")
          .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      const db = await readDatabase();
      const submissionIdToReject = interaction.options
        .getString("submission_id")
        .toUpperCase(); // Cocokkan uppercase
      const targetUser = interaction.options.getUser("user"); // User opsional

      let foundSubmission = null;
      let campaignId = null;

      // Cari submission di semua campaign
      for (const cId in db.dataCampaigns) {
        const campaign = db.dataCampaigns[cId];
        foundSubmission = campaign.submissions.find(
          (sub) =>
            sub.submissionId === submissionIdToReject &&
            (!targetUser || sub.userId === targetUser.id) // Cek user jika diberikan
        );
        if (foundSubmission) {
          campaignId = cId;
          break; // Hentikan pencarian jika ditemukan
        }
      }

      if (!foundSubmission) {
        let errorMsg = `❌ Submission dengan ID "${submissionIdToReject}" tidak ditemukan.`;
        if (targetUser) errorMsg += ` untuk user ${targetUser.username}.`;
        await interaction.editReply(errorMsg);
        return;
      }

      // Cek jika sudah di-reject
      if (foundSubmission.status === "rejected") {
        await interaction.editReply(
          `Submission ${submissionIdToReject} sudah ditolak sebelumnya.`
        );
        return;
      }
      // Cek jika sudah di-accept (tidak bisa di-reject lagi)
      if (foundSubmission.status === "accepted") {
        await interaction.editReply(
          `Submission ${submissionIdToReject} sudah diterima dan dibayar, tidak bisa ditolak.`
        );
        return;
      }

      // Update status dan earning
      foundSubmission.status = "rejected";
      const previousEarnings = foundSubmission.totalEarnings; // Simpan earning sebelum di-nol-kan
      foundSubmission.totalEarnings = 0;

      // Kembalikan budget jika tipenya "Per Submission" dan sudah dicatat (seharusnya tidak terjadi lagi)
      // if (db.dataCampaigns[campaignId].payoutType === 'submission' && previousEarnings > 0) {
      //     db.dataCampaigns[campaignId].budgetRemaining += previousEarnings; // Opsional: Kembalikan budget?
      // }

      await writeDatabase(db);

      await interaction.editReply(
        `✅ Submission dengan ID \`${submissionIdToReject}\` telah ditolak. Potensi earning direset ke $0.`
      );
    } catch (error) {
      console.error("Reject error:", error);
      await interaction.editReply("Terjadi error saat menolak submission.");
    }
  },
};
