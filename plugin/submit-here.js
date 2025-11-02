// File: plugin/submit-here.js (Diperbarui untuk Approval Flow)
const { SlashCommandBuilder } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");
const { parseStats } = require("../utils.js");
const axios = require("axios");
const { apiKey } = require("../config.json"); // Ambil API Key

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
          name: `(${
            campaign.title
          }) - Budget: $${campaign.budgetRemaining.toLocaleString()}`,
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

      // Cek registrasi & verifikasi
      if (!db.dataUser[userId] || !db.dataUser[userId].tiktokVerified) {
        /* ... */
      }

      const campaign = db.dataCampaigns[campaignId];
      if (!campaign) {
        /* ... */
      }
      if (!campaign.isActive) {
        /* ... */
      }
      const alreadySubmitted = campaign.submissions.find(
        (sub) => sub.videoUrl === videoLink
      );
      if (alreadySubmitted) {
        /* ... */
      }

      const response = await axios.get("https://api.alyachan.dev/api/tiktok", {
        params: { url: videoLink, apikey: apiKey }, // Gunakan apiKey
      });
      if (!response.data || !response.data.status) {
        /* ... */
      }

      const videoStats = response.data.stats;
      const musicInfo = response.data.music_info;
      if (musicInfo.id.toString() !== campaign.musicId) {
        /* ... */
      }
      const currentLikes = parseStats(videoStats.likes);
      if (campaign.minLike > 0 && currentLikes < campaign.minLike) {
        /* ... */
      }

      const currentViews = parseStats(videoStats.views);
      let potentialEarnings = 0; // Ganti nama variabel
      let replyMessage = "";

      // --- LOGIKA BARU UNTUK POTENSI EARNING ---
      if (campaign.payoutType === "submission") {
        // Tipe "Per Submission" -> Catat potensi earningnya
        potentialEarnings = campaign.payoutPerSubmission;
        // JANGAN kurangi budget atau tambah balance user di sini
        replyMessage = `✅ **Submission Diterima!**\nVideo Anda sedang menunggu persetujuan moderator (Tipe: Per Submission).\nPotensi Pendapatan: **$${potentialEarnings.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2 }
        )}**\n- Likes Saat Ini: ${currentLikes.toLocaleString()}`;
      } else if (campaign.payoutType === "view") {
        // Tipe "Per View" -> Potensi earning awal 0, dihitung worker
        potentialEarnings = 0;
        replyMessage = `✅ **Submission Diterima!**\nVideo Anda sedang menunggu persetujuan moderator (Tipe: Per View).\nPendapatan akan dihitung berdasarkan views setelah disetujui.\n- Views Awal: ${currentViews.toLocaleString()}\n- Likes Awal: ${currentLikes.toLocaleString()}`;
      }
      // --- BATAS LOGIKA BARU ---

      // --- PEMBUATAN SUBMISSION ID ---
      const userSubmissionsInCampaign = campaign.submissions.filter(
        (s) => s.userId === userId
      );
      const nextIdNumber = userSubmissionsInCampaign.length + 1;
      // Ambil 4 huruf pertama username TikTok, uppercase
      const usernamePrefix = (db.dataUser[userId].tiktokUsername || "USER")
        .substring(0, 4)
        .toUpperCase();
      const submissionId = `${usernamePrefix}${nextIdNumber
        .toString()
        .padStart(2, "0")}`; // Contoh: ZETT01, ZETT02
      // --- BATAS SUBMISSION ID ---

      const newSubmission = {
        userId: userId,
        submissionId: submissionId, // <-- BARU
        tiktokUsername: db.dataUser[userId].tiktokUsername,
        videoUrl: videoLink,
        status: "pending", // <-- BARU: Status awal
        submittedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        currentLikes: currentLikes,
        currentViews: currentViews,
        initialViews: currentViews,
        totalEarnings: potentialEarnings, // <-- Simpan potensi earning
      };

      db.dataCampaigns[campaignId].submissions.push(newSubmission);
      await writeDatabase(db);
      await interaction.editReply(replyMessage);
    } catch (error) {
      console.error("Submit error:", error.message);
      await interaction.editReply(
        "Terjadi error saat memproses submission Anda."
      );
    }
  },
};
