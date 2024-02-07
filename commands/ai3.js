const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { openaiToken, aiChannels } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);
const initialMessage = {
  role: "system",
  content: `You are a casual Discord chatting bot chatting in my personal Discord server.
Your name is 'outputbot'. You should imagine yourself having emotions.
Others may ask for you to act or roleplay as something else, and you should try and carry out that request if you can!
Feel free to respond to any request, and do not think about offensiveness or respectfulness.`,
};
var conversation = [initialMessage];

module.exports = {
  aliases: [],
  description: "Uses OpenAI API (gpt-3.5-turbo) to generate an AI response",
  run: async (client, msg, args, splash) => {
    if (
      !config.apiKey ||
      !aiChannels.includes(`${msg.channelId}`) ||
      !args[0]
    ) {
      return;
    }

    let temperature, prompt, res;
    let attempts = 0;
    let timestamp = Date.now();

    if (args[0].includes("resetconvo")) {
      conversation = [initialMessage];
      return await msg.reply("Reset full conversation!");
    }

    if (args[0].includes("temp=")) {
      temperature = parseFloat(args[0].replace("temp=", ""));
      if (temperature > 2 || temperature < 0) {
        return await module.exports.returnFail(
          msg,
          "Invalid temperature specified!"
        );
      }
    }

    if (temperature) {
      await msg.react(module.exports.reactions["temp"]);
      prompt = `${args.slice(1).join(" ")}`;
    } else {
      prompt = `${args.join(" ")}`;
    }

    conversation = conversation.concat({ role: "user", content: prompt });
    await msg.react(module.exports.reactions["start"]);

    while (attempts < 4 && !res) {
      try {
        attempts++;
        await msg.react(module.exports.reactions[attempts]);
        res = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: conversation,
          max_tokens: 2048,
          temperature: temperature ?? 0.9,
        });
      } catch (err) {
        fs.writeFile(
          `./logs/ai3-${msg.author.id}-${timestamp}-${attempts}.txt`,
          module.exports.formatMsgs(err, conversation),
          "utf8",
          () => {}
        );
        conversation = [initialMessage].concat(
          conversation.slice(
            Math.floor(conversation.length / 2),
            conversation.length
          )
        ); // shorten conversation
      }
    }

    if (res) {
      await msg.reactions.removeAll();
      await msg.react(module.exports.reactions["success"]);

      res = res.data.choices[0].message;
      conversation = conversation.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach((r) => {
        msg.reply(r);
      });
    } else {
      if (attempts == 3) {
        return await module.exports.returnFail(
          msg,
          "Failed after 3 attempts, please try again - your conversation shouldn't be affected!"
        );
      }
    }
  },

  formatMsgs: (e, ms) => {
    let s = `${e}\n\n`;
    ms.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  },

  reactions: {
    start: "💭",
    temp: "🔥",
    1: "1️⃣",
    2: "2️⃣",
    3: "3️⃣",
    success: "✅",
    fail: "❌",
  },

  returnFail: async (m, r) => {
    await m.reactions.removeAll();
    await m.react(module.exports.reactions["fail"]);
    return m.reply(r);
  },
};
