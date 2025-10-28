// File: plugin/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Memeriksa latency bot dan API Discord."),

  async execute(interaction) {
    const wsPing = interaction.client.ws.ping;
    const sent = await interaction.reply({
      content: "🏓 Menghitung latency...",
      fetchReply: true,
      flags: 64,
    });
    const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;

    const pingEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Pong! 🏓")
      .addFields(
        { name: "Ping WebSocket", value: `\`${wsPing}ms\``, inline: true },
        { name: "Ping API", value: `\`${apiLatency}ms\``, inline: true }
      )
      .setTimestamp();
    await interaction.editReply({
      content: "Selesai!",
      embeds: [pingEmbed],
    });
  },
};
