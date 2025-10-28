// File: plugin/submit-here.js (Diperbarui)
const { SlashCommandBuilder } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");
const { parseStats } = require("../utils.js");
const axios = require("axios");

module.exports = {
  // ... (data dan autocomplete TETAP SAMA) ...
  data: new SlashCommandBuilder()
    .setName("submit-here")
    .setDescription("Submit video TikTok Anda untuk campaign.")
    .addStringOption((option) =>
      option
        .setName("campaign")
        .setDescription("Pilih campaign yang ingin Anda ikuti.")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("Link video TikTok Anda.")
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      const db = await readDatabase();
      const campaigns = Object.values(db.dataCampaigns).filter(
        (c) => c.isActive
      );
      const filtered = campaigns
        .filter((campaign) =>
          campaign.title.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);
      await interaction.respond(
        filtered.map((campaign) => ({
          name: `(${campaign.title}) - Budget: $${campaign.budgetRemaining}`,
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
      let db = await readDatabase();
      const userId = interaction.user.id;
      const campaignId = interaction.options.getString("campaign");
      const videoLink = interaction.options.getString("link");

      // Cek registrasi dan verifikasi
      if (!db.dataUser[userId] || !db.dataUser[userId].tiktokVerified) {
        await interaction.editReply(
          "❌ Anda harus terdaftar dan terverifikasi TikTok."
        );
        return;
      }

      // ... (Cek campaign, cek link duplikat, panggil API, cek music ID, cek min like - SEMUA SAMA) ...
      const campaign = db.dataCampaigns[campaignId];
      if (!campaign) {
        /*...*/
      }
      if (!campaign.isActive) {
        /*...*/
      }
      const alreadySubmitted = campaign.submissions.find(
        (sub) => sub.videoUrl === videoLink
      );
      if (alreadySubmitted) {
        /*...*/
      }
      const response = await axios.get("https://api.alyachan.dev/api/tiktok", {
        params: { url: videoLink, apikey: "aiscya" },
      });
      if (!response.data || !response.data.status) {
        /*...*/
      }
      const videoStats = response.data.stats;
      const musicInfo = response.data.music_info;
      if (musicInfo.id.toString() !== campaign.musicId) {
        /*...*/
      }
      const currentLikes = parseStats(videoStats.likes);
      if (campaign.minLike > 0 && currentLikes < campaign.minLike) {
        /*...*/
      }

      const currentViews = parseStats(videoStats.views);
      let totalEarnings = 0;
      let replyMessage = "";

      // --- LOGIKA BARU UNTUK BALANCE ---
      if (campaign.payoutType === "submission") {
        const payoutAmount = campaign.payoutPerSubmission;
        if (campaign.budgetRemaining < payoutAmount) {
          await interaction.editReply(
            "❌ Submission ditolak. Budget campaign habis."
          );
          return;
        }

        campaign.budgetRemaining -= payoutAmount;
        totalEarnings = payoutAmount;

        // TAMBAHKAN BALANCE KE USER
        if (!db.dataUser[userId].balance) db.dataUser[userId].balance = 0; // Safety init
        db.dataUser[userId].balance += payoutAmount;

        replyMessage = `✅ **Submission Approved!**\nAnda mendapat: **$${payoutAmount.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2 }
        )}**\n- Likes: ${currentLikes.toLocaleString()}`;
      } else if (campaign.payoutType === "view") {
        totalEarnings = 0;
        replyMessage = `✅ **Submission Approved!**\n(Tipe: Per View). Payout akan dihitung otomatis.\n- Views: ${currentViews.toLocaleString()}\n- Likes: ${currentLikes.toLocaleString()}`;
      }
      // --- BATAS LOGIKA BARU ---

      const newSubmission = {
        userId: userId,
        tiktokUsername: db.dataUser[userId].tiktokUsername,
        videoUrl: videoLink,
        status: "approved",
        submittedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        currentLikes: currentLikes,
        currentViews: currentViews,
        initialViews: currentViews,
        totalEarnings: totalEarnings,
      };

      db.dataCampaigns[campaignId].submissions.push(newSubmission);
      await writeDatabase(db); // Menyimpan balance user DAN data campaign
      await interaction.editReply(replyMessage);
    } catch (error) {
      console.error("Submit error:", error.message);
      await interaction.editReply(
        "Terjadi error saat memproses submission Anda."
      );
    }
  },
};
