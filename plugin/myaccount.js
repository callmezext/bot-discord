// File: plugin/myaccount.js (Diperbarui)
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myaccount")
    .setDescription(
      "Menampilkan detail akun Discord dan TikTok Anda (Data TikTok Live)."
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const db = await readDatabase();
    const userId = interaction.user.id;

    if (!db.dataUser[userId]) {
      await interaction.editReply({ content: "Anda belum terdaftar." });
      return;
    }

    const userData = db.dataUser[userId];
    const regTimestamp = Math.floor(
      new Date(userData.registeredAt).getTime() / 1000
    );

    // Safety check untuk balance (jika user mendaftar sebelum update)
    if (!userData.balance) userData.balance = 0;

    if (!userData.tiktokVerified || !userData.tiktokInfo) {
      // Tampilan jika TikTok belum terhubung
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Profil Akun: ${interaction.user.username}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          // --- TAMBAHAN BARU ---
          {
            name: "Balance",
            value: `**$${userData.balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}**`,
            inline: false,
          },
          // --- BATAS TAMBAHAN ---
          { name: "Status", value: "Terdaftar", inline: true },
          {
            name: "Bergabung Sejak",
            value: `<t:${regTimestamp}:F>`,
            inline: false,
          },
          { name: "--- Akun TikTok ---", value: "\u200B" },
          {
            name: "Status TikTok",
            value: "Belum terhubung. Silakan gunakan `/settiktok`.",
          }
        );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Tampilan jika TikTok terhubung
    const usernameToFetch = userData.tiktokUsername;
    let footerText = `Data TikTok live @ ${new Date().toLocaleTimeString(
      "id-ID"
    )}`;

    try {
      const response = await axios.get(
        "https://api.alyachan.dev/api/tiktok-stalk",
        {
          params: { username: usernameToFetch, apikey: "aiscya" },
        }
      );
      const freshInfo = response.data.userInfo;
      const freshStats = response.data.userInfo.stats;
      if (freshInfo && freshStats) {
        // Update DB dengan data fresh
        userData.tiktokInfo = {
          id: freshInfo.id,
          uniqueId: freshInfo.uniqueId,
          nickname: freshInfo.nickname,
          signature: freshInfo.signature,
          avatar: freshInfo.avatarLarger || freshInfo.avatarMedium,
          verified: freshInfo.verified,
          followerCount: freshStats.followerCount || 0,
          followingCount: freshStats.followingCount || 0,
          heartCount: freshStats.heartCount || freshStats.heart || 0,
          videoCount: freshStats.videoCount || 0,
        };
        await writeDatabase(db);
      } else {
        throw new Error("Respons API tidak lengkap.");
      }
    } catch (error) {
      console.error("Gagal fetch data /myaccount:", error.message);
      footerText = "Gagal mengambil data live. Menampilkan data tersimpan.";
    }

    const displayInfo = userData.tiktokInfo;
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(
        displayInfo.nickname
          ? `${displayInfo.nickname} (@${displayInfo.uniqueId})`
          : `@${displayInfo.uniqueId}`
      )
      .setURL(`https://www.tiktok.com/@${displayInfo.uniqueId}`)
      .setThumbnail(displayInfo.avatar || interaction.user.displayAvatarURL())
      .addFields(
        // --- TAMBAHAN BARU ---
        {
          name: "Balance",
          value: `**$${userData.balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}**`,
          inline: false,
        },
        // --- BATAS TAMBAHAN ---
        {
          name: "Followers",
          value: (displayInfo.followerCount || 0).toLocaleString("id-ID"),
          inline: true,
        },
        {
          name: "Following",
          value: (displayInfo.followingCount || 0).toLocaleString("id-ID"),
          inline: true,
        },
        {
          name: "Total Likes",
          value: (displayInfo.heartCount || 0).toLocaleString("id-ID"),
          inline: true,
        },
        {
          name: "Total Videos",
          value: (displayInfo.videoCount || 0).toLocaleString("id-ID"),
          inline: true,
        },
        {
          name: "Bio",
          value: displayInfo.signature
            ? displayInfo.signature.substring(0, 100) + "..."
            : "Tidak ada bio.",
          inline: false,
        },
        // { name: "--- Akun Discord ---", value: "\u200B" },
        {
          name: "Terdaftar Sebagai",
          value: `${interaction.user.username}`,
          inline: true,
        },
        {
          name: "Bergabung Sejak",
          value: `<t:${regTimestamp}:R>`,
          inline: true,
        }
      )
      .setFooter({ text: footerText });
    await interaction.editReply({ embeds: [embed] });
  },
};
