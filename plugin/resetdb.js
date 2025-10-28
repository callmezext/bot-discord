// File: plugin/resetdb.js
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { readDatabase, writeDatabase } = require("../db-handler.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetdb")
    .setDescription(
      "Mereset (menghapus) bagian dari database bot. (Admin Only)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("Bagian database yang ingin dihapus.")
        .setRequired(true)
        .addChoices(
          { name: "Hapus Data User Saja", value: "users" },
          { name: "Hapus Data Campaign Saja", value: "campaigns" },
          { name: "HAPUS SEMUA (USERS DAN CAMPAIGNS)", value: "all" }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const target = interaction.options.getString("target");
    const db = await readDatabase();
    let message = "";

    try {
      switch (target) {
        case "users":
          db.dataUser = {};
          message = "✅ Database `dataUser` telah berhasil dikosongkan.";
          break;
        case "campaigns":
          db.dataCampaigns = {};
          message = "✅ Database `dataCampaigns` telah berhasil dikosongkan.";
          break;
        case "all":
          db.dataUser = {};
          db.dataCampaigns = {};
          db.items = [];
          message = "🚨 **RESET TOTAL BERHASIL!**";
          break;
        default:
          message = "Target tidak valid.";
      }
      await writeDatabase(db);
      await interaction.editReply(message);
    } catch (error) {
      console.error("Error saat reset DB:", error);
      await interaction.editReply("Terjadi error saat mereset database.");
    }
  },
};
