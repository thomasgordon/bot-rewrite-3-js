const { ActivityType } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { openaiToken } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);

module.exports = {
  aliases: ["ai2"],
  description: "Uses OpenAI API (text-davinci-002) to generate an AI response",
  run: async (client, msg, args, splash) => {
    if (!config.apiKey) {
      return;
    }

    const prompt = `${args.join(" ")}`;
    var res;

    msg.channel.send(
      `Generating OpenAI (text-davinci-002) response with prompt:\n${prompt}`
    );
    client.user.setPresence({
      activities: [{ name: "AI2 response...", type: ActivityType.Streaming }],
    });

    try {
      res = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: prompt,
        temperature: 0.9,
        top_p: 0.9,
        max_tokens: 1024,
        stop: ["<|endoftext|>"],
      });
    } catch (err) {
      fs.writeFile(
        `./logs/ai2-${msg.author.id}-${Date.now()}.txt`,
        `${err}\n\n${msg.content}`,
        "utf8",
        () => {}
      );
      return msg.reply("Ran into an error! Try again?");
    }

    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Streaming }],
    });

    if (res) {
      res = res.data.choices[0].text;
      if (res.length > 2000) {
        const resArray = res.match(/[\s\S]{1,2000}(?!\S)/g);
        resArray.forEach((r) => {
          msg.reply(r);
        });
      } else {
        msg.reply(res);
      }
    }
  },
};
