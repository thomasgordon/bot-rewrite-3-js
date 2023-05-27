const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const gTTS = require("gtts");

module.exports = {
  aliases: [],
  description: "Generate a TTS output from a given input",
  run: async (client, msg, args) => {
    if (!args.length) {
      return;
    }

    const player = createAudioPlayer();
    joinVoiceChannel({
      channelId: msg.member.voice.channelId,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator,
    }).subscribe(player);

    var gtts = new gTTS(`${args.join(" ")}`, "en");
    const res = createAudioResource(gtts.stream());
    player.play(res);
  },
};
