// File: plugin/setTiktok.js (Nama Diperbarui)
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");
const axios = require("axios");
const { apiKey } = require("../config.json"); // Ambil API Key

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "FT";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  data: new SlashCommandBuilder()
    // --- PERUBAHAN DI SINI ---
    .setName("set-tiktok") // <-- Nama diubah
    // -------------------------
    .setDescription("Menghubungkan akun TikTok Anda untuk verifikasi.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Username TikTok Anda (tanpa @).")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const db = await readDatabase();
    const userId = interaction.user.id;

    if (!db.dataUser[userId]) {
      await interaction.editReply(
        "Anda harus terdaftar. Silakan gunakan `/register` terlebih dahulu."
      );
      return;
    }

    const tiktokUsername = interaction.options
      .getString("username")
      .replace("@", "");
    const verificationCode = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    db.dataUser[userId].tiktokVerification = {
      code: verificationCode,
      username: tiktokUsername,
      expiresAt: expiresAt,
    };
    await writeDatabase(db);

    const embed = new EmbedBuilder()
      .setColor(0xffff00)
      .setTitle("Verifikasi Akun TikTok")
      .setDescription(
        `**Langkah 1:** Salin kode unik di bawah ini.\n**Langkah 2:** Tempel (paste) kode ini di **Bio/Signature** profil TikTok Anda.\n**Langkah 3:** Klik tombol "Verify Now" di bawah.\n\nKode ini akan kedaluwarsa dalam **5 menit**.`
      )
      .addFields({ name: "Username", value: `@${tiktokUsername}` })
      .addFields({ name: "Kode Verifikasi", value: `\`${verificationCode}\`` });

    const verifyButton = new ButtonBuilder()
      .setCustomId("verify_tiktok_now")
      .setLabel("Verify Now")
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(verifyButton);
    await interaction.editReply({ embeds: [embed], components: [row] });

    const filter = (i) =>
      i.customId === "verify_tiktok_now" && i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 300000, // 5 menit
    });

    collector.on("collect", async (i) => {
      await i.deferReply({ flags: 64 });
      const currentDb = await readDatabase();
      const userData = currentDb.dataUser[userId];
      const verificationData = userData.tiktokVerification;

      if (!verificationData || Date.now() > verificationData.expiresAt) {
        await i.editReply(
          "Kode verifikasi Anda sudah kedaluwarsa. Silakan mulai lagi dengan `/set-tiktok`." // <-- Nama diubah di pesan error juga
        );
        return;
      }

      try {
        const response = await axios.get(
          "https://api.alyachan.dev/api/tiktok-stalk",
          {
            params: { username: verificationData.username, apikey: apiKey }, // Gunakan apiKey
          }
        );

        const userInfo = response.data.userInfo;
        const userStats = response.data.userInfo.stats; // Path yang benar
        const signature = userInfo.signature;

        if (signature.includes(verificationData.code)) {
          userData.tiktokVerified = true;
          userData.tiktokUsername = userInfo.uniqueId;
          userData.tiktokVerification = null;
          let follower = 0,
            following = 0,
            heart = 0,
            video = 0;
          if (userStats) {
            follower = userStats.followerCount || 0;
            following = userStats.followingCount || 0;
            heart = userStats.heartCount || userStats.heart || 0;
            video = userStats.videoCount || 0;
          }
          userData.tiktokInfo = {
            id: userInfo.id || null,
            uniqueId: userInfo.uniqueId || null,
            nickname: userInfo.nickname || null,
            signature: userInfo.signature || null,
            avatar: userInfo.avatarLarger || userInfo.avatarMedium || null,
            verified: userInfo.verified || false,
            followerCount: follower,
            followingCount: following,
            heartCount: heart,
            videoCount: video,
          };

          await writeDatabase(currentDb);
          await i.editReply(
            "✅ **Verifikasi Berhasil!** Akun TikTok Anda telah terhubung."
          );
          await interaction.editReply({
            content: "Verifikasi berhasil!",
            components: [],
          });
          collector.stop();
        } else {
          await i.editReply("❌ **Gagal!** Kode tidak ditemukan di bio Anda.");
        }
      } catch (error) {
        console.error(error);
        await i.editReply(
          "Terjadi error saat menghubungi API TikTok. Pastikan username valid."
        );
      }
    });

    collector.on("end", (collected) => {
      // Hanya edit jika interaksi belum dibalas (misal oleh error atau success)
      if (!interaction.replied && collected.size === 0) {
        interaction
          .editReply({
            content: "Waktu verifikasi telah habis.",
            embeds: [],
            components: [],
          })
          .catch(console.error); // Tangkap error jika editReply gagal (misal interaksi sudah tidak ada)
      }
    });
  },
};
