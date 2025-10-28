// File: plugin/campaign-create.js (Diperbarui dengan Cover Image)
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("campaign-create")
    .setDescription("Membuat campaign baru (Moderator Only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Judul campaign/music.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("music_id")
        .setDescription("ID Music TikTok.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("music_link")
        .setDescription("Link ke music/sound di TikTok.")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("budget")
        .setDescription("Total budget untuk campaign ini (cth: 1000).")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("payout_type")
        .setDescription("Metode pembayaran untuk campaign.")
        .setRequired(true)
        .addChoices(
          { name: "Per View (Dinamis, dibayar per view)", value: "view" },
          {
            name: "Per Submission (Tetap, dibayar per video)",
            value: "submission",
          }
        )
    )
    .addNumberOption((option) =>
      option
        .setName("rate_per_1m_views")
        .setDescription("Payout $ per 1 Juta views (cth: 120).")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("payout_per_submission")
        .setDescription("Payout $ per video (cth: 5).")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("min_like")
        .setDescription(
          'Minimum like untuk submit (Wajib untuk "Per Submission").'
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("deskripsi")
        .setDescription("Deskripsi campaign (Opsional).")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("max_submission")
        .setDescription("Jumlah max submission per user (Opsional).")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("cover_image_link")
        .setDescription("Link gambar cover untuk campaign (Opsional).")
        .setRequired(false)
    ), // <-- BARU

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    let newCampaign;

    try {
      const payoutType = interaction.options.getString("payout_type");
      const ratePer1mViews = interaction.options.getNumber("rate_per_1m_views");
      const payoutPerSubmission = interaction.options.getNumber(
        "payout_per_submission"
      );
      const minLike = interaction.options.getInteger("min_like");

      if (payoutType === "view" && !ratePer1mViews) {
        await interaction.editReply(
          '❌ Tipe "Per View" wajib mengisi `rate_per_1m_views`.'
        );
        return;
      }
      if (payoutType === "submission" && !payoutPerSubmission) {
        await interaction.editReply(
          '❌ Tipe "Per Submission" wajib mengisi `payout_per_submission`.'
        );
        return;
      }
      if (payoutType === "submission" && !minLike) {
        await interaction.editReply(
          '❌ Tipe "Per Submission" wajib mengisi `min_like`.'
        );
        return;
      }

      const db = await readDatabase();
      const campaignId = `C-${Date.now()}`;
      const totalBudget = interaction.options.getNumber("budget");

      newCampaign = {
        id: campaignId,
        title: interaction.options.getString("title"),
        musicId: interaction.options.getString("music_id"),
        musicLink: interaction.options.getString("music_link"),
        totalBudget: totalBudget,
        budgetRemaining: totalBudget,
        payoutType: payoutType,
        ratePer1mViews: ratePer1mViews || null,
        payoutPerSubmission: payoutPerSubmission || null,
        minLike: minLike || 0,
        maxSubmission: interaction.options.getInteger("max_submission") || null,
        description:
          interaction.options.getString("deskripsi") || "Tidak ada deskripsi.",
        isActive: true,
        createdAt: new Date().toISOString(),
        creatorId: interaction.user.id,
        coverImageLink:
          interaction.options.getString("cover_image_link") || null, // <-- BARU: Simpan link cover
        submissions: [],
      };

      db.dataCampaigns[campaignId] = newCampaign;
      await writeDatabase(db);

      await interaction.editReply(
        `✅ Campaign baru berhasil dibuat!\n**ID:** \`${campaignId}\`\n**Budget:** $${totalBudget}\n**Tipe:** ${pouchType}`
      );
    } catch (error) {
      console.error("Error saat membuat campaign:", error);
      await interaction.editReply("Terjadi error saat membuat campaign.");
      return;
    }

    // --- KIRIM PENGUMUMAN (SETELAH CAMPAIGN BERHASIL DIBUAT) ---
    try {
      const currentDb = await readDatabase();
      if (
        currentDb.botSettings &&
        currentDb.botSettings.announcementChannelId
      ) {
        const channelId = currentDb.botSettings.announcementChannelId;
        const announcementChannel = await interaction.guild.channels.fetch(
          channelId
        );

        if (announcementChannel && announcementChannel.isTextBased()) {
          const announcementEmbed = new EmbedBuilder()
            .setColor(0xffff00)
            .setTitle("✨ Campaign Baru Telah Dibuka! ✨")
            .setDescription(
              `Ayo ikuti campaign musik terbaru:\n**${newCampaign.title}**`
            )
            .addFields({
              name: "🎵 Link Musik",
              value: `[Klik di sini](${newCampaign.musicLink})`,
            });

          if (newCampaign.coverImageLink) {
            // <-- BARU: Tambah thumbnail jika ada
            announcementEmbed.setThumbnail(newCampaign.coverImageLink);
          }

          if (newCampaign.payoutType === "view") {
            announcementEmbed.addFields({
              name: "💰 Rate",
              value: `$${newCampaign.ratePer1mViews} / 1 Juta Views`,
            });
          } else {
            announcementEmbed.addFields({
              name: "💰 Payout",
              value: `$${newCampaign.payoutPerSubmission} / Video`,
            });
          }

          if (newCampaign.minLike > 0) {
            announcementEmbed.addFields({
              name: "👍 Minimum Like",
              value: `${newCampaign.minLike.toLocaleString("id-ID")}`,
            });
          }

          announcementEmbed
            .addFields({ name: "📝 Deskripsi", value: newCampaign.description })
            .addFields({
              name: "➡️ Cara Ikut",
              value: "Gunakan perintah `/submit-here` dan pilih campaign ini!",
            })
            .setTimestamp();

          await announcementChannel.send({ embeds: [announcementEmbed] });
          console.log(
            `[INFO] Pengumuman campaign ${newCampaign.id} dikirim ke channel ${channelId}`
          );
        } else {
          console.warn(
            `[WARN] Channel pengumuman ${channelId} tidak ditemukan atau bukan text channel.`
          );
        }
      } else {
        console.log(
          "[INFO] Channel pengumuman belum diatur. Lewati pengiriman."
        );
      }
    } catch (announceError) {
      console.error(
        `Gagal mengirim pengumuman campaign ${newCampaign.id}:`,
        announceError.message
      );
    }
  },
};
