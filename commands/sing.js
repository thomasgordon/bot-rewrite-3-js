const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core-discord");

module.exports = {
  aliases: ["play", "stream"],
  data: new SlashCommandBuilder()
    .setName("sing")
    .setDescription("Streams from a YouTube url")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription("The YouTube URL to stream from")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const url = interaction.options.getString("url");

    try {
      const player = createAudioPlayer();
      joinVoiceChannel({
        channelId: interaction.member.voice.channelId,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      }).subscribe(player);

      const res = createAudioResource(await ytdl(url));
      player.play(res);
    } catch (e) {
      await interaction.reply(e.message);
    }
  },
};
