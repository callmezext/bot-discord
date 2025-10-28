// File: plugin/campaign-edit.js (Diperbarui dengan Cover Image)
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("campaign-edit")
    .setDescription("Mengedit campaign yang sudah ada (Moderator Only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("campaign_id")
        .setDescription("ID Campaign yang akan diedit.")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Judul campaign/music baru.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("music_id")
        .setDescription("ID Music TikTok baru.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("music_link")
        .setDescription("Link ke music/sound di TikTok baru.")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("min_like")
        .setDescription("Minimum like baru untuk submit.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("deskripsi")
        .setDescription("Deskripsi campaign baru.")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("is_active")
        .setDescription("Set status campaign (aktif/nonaktif).")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("budget")
        .setDescription(
          "Set total budget baru (akan me-reset budget remaining)."
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("payout_type")
        .setDescription("Ubah metode pembayaran.")
        .setRequired(false)
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
        .setDescription("Payout $ baru per 1 Juta views.")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("payout_per_submission")
        .setDescription("Payout $ baru per video.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("cover_image_link")
        .setDescription("Link gambar cover baru untuk campaign.")
        .setRequired(false)
    ), // <-- BARU

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
      if (!db.dataCampaigns[campaignId]) {
        await interaction.editReply(
          "❌ Campaign dengan ID tersebut tidak ditemukan."
        );
        return;
      }

      const campaign = db.dataCampaigns[campaignId];
      let changes = [];

      const title = interaction.options.getString("title");
      if (title) {
        campaign.title = title;
        changes.push(`Judul -> ${title}`);
      }
      const music_id = interaction.options.getString("music_id");
      if (music_id) {
        campaign.musicId = music_id;
        changes.push(`Music ID -> ${music_id}`);
      }
      const music_link = interaction.options.getString("music_link");
      if (music_link) {
        campaign.musicLink = music_link;
        changes.push(`Music Link -> (diperbarui)`);
      }
      const min_like = interaction.options.getInteger("min_like");
      if (min_like !== null) {
        campaign.minLike = min_like;
        changes.push(`Min Like -> ${min_like}`);
      }
      const deskripsi = interaction.options.getString("deskripsi");
      if (deskripsi) {
        campaign.description = deskripsi;
        changes.push(`Deskripsi -> (diperbarui)`);
      }
      const is_active = interaction.options.getBoolean("is_active");
      if (is_active !== null) {
        campaign.isActive = is_active;
        changes.push(`Status Aktif -> ${is_active}`);
      }
      const budget = interaction.options.getNumber("budget");
      if (budget !== null) {
        campaign.totalBudget = budget;
        campaign.budgetRemaining = budget;
        changes.push(`Total Budget -> $${budget} (Budget Remaining di-reset)`);
      }
      const payout_type = interaction.options.getString("payout_type");
      if (payout_type) {
        campaign.payoutType = payout_type;
        changes.push(`Tipe Payout -> ${payout_type}`);
      }
      const rate_per_1m_views =
        interaction.options.getNumber("rate_per_1m_views");
      if (rate_per_1m_views !== null) {
        campaign.ratePer1mViews = rate_per_1m_views;
        changes.push(`Rate per 1M Views -> $${rate_per_1m_views}`);
      }
      const payout_per_submission = interaction.options.getNumber(
        "payout_per_submission"
      );
      if (payout_per_submission !== null) {
        campaign.payoutPerSubmission = payout_per_submission;
        changes.push(`Payout per Submission -> $${payout_per_submission}`);
      }
      const cover_image_link =
        interaction.options.getString("cover_image_link"); // <-- BARU
      if (cover_image_link !== null) {
        campaign.coverImageLink = cover_image_link;
        changes.push(`Link Cover -> (diperbarui)`);
      } // <-- BARU

      if (changes.length === 0) {
        await interaction.editReply("Tidak ada perubahan yang dilakukan.");
        return;
      }
      await writeDatabase(db);
      await interaction.editReply(
        `✅ Campaign \`${campaignId}\` berhasil diperbarui:\n- ${changes.join(
          "\n- "
        )}`
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply("Terjadi error saat mengedit campaign.");
    }
  },
};
