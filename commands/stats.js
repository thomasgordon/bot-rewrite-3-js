const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: [],
  description: "Show server statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return;
    var outputMessage = "";

    var sortedScores = Object.entries(guildStats).map(([k, v]) => {
      return [
        k,
        (v["score"] = Math.max(
          0,
          v["voiceTime"] +
            v["messages"] * 20 -
            Object.values(v["nerdEmojis"]).reduce(
              (sum, a) => sum + 2 ** a - 1,
              0
            )
        )),
      ];
    });
    sortedScores.forEach((a) => {
      a["score"] = a > 2500 ? a - v["decay"] : a;
    });
    sortedScores.sort(function (f, s) {
      return s[1] - f[1];
    });

    sortedScores.forEach((a, i) => {
      outputMessage += `${module.exports.getNickname(
        msg,
        a[0]
      )}\n    Messages: ${
        guildStats[a[0]]["messages"]
      }\n    Voice Time: ${module.exports.formatTime(
        guildStats[a[0]]["voiceTime"]
      )}\n    Ranking: ${module.exports.getRanking(guildStats[a[0]])} (${
        a[1]
      }SR, #${i + 1} of friends)\n\n`;
    });

    msg.reply("```\n" + outputMessage + "\n```");
  },
  formatTime: (time) => {
    if (time == 0) return "0s";

    var units = { h: 0, m: 0, s: 0 };

    while (time >= 3600) {
      time -= 3600;
      units["h"] += 1;
    }

    while (time >= 60) {
      time -= 60;
      units["m"] += 1;
    }

    units["s"] = time; // for consistency

    // does this formatting method suck? yea
    // there is an easier way surely with Object.keys(units)
    // TODO: above
    return `${units["h"] ? units["h"] + "h " : ""}${
      units["m"] ? units["m"] + "m " : ""
    }${units["s"] ? units["s"] + "s " : ""}`;
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return `${member.nickname ?? member.user.username}${
      msg.author.id == id ? " <----" : ""
    }`;
  },
  getRanking: (memberStats) => {
    var bestRank;
    Object.entries(ranks).forEach(([k, v]) => {
      if (v < memberStats["score"]) {
        bestRank = k;
      }
    });
    return bestRank;
  },
};
