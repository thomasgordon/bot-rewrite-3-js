/* eslint-disable indent */
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");
const { Table } = require("console-table-printer");

module.exports = {
  aliases: ["statistics", "leaderboard", "scores"],
  description: "Show server statistics.",
  run: async ([, msg], second = false) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return msg.reply("This server has no statistics yet!");

    const topNerder = Object.entries(guildStats)
      .filter((k) => k[0].length == 18)
      .map(([k, v]) => {
        return [k, v["nerdsGiven"] ?? 0];
      })
      .sort((f, s) => {
        return s[1] - f[1];
      })[0];

    const topNerded = Object.entries(guildStats)
      .filter((k) => k[0].length == 18)
      .map(([k, v]) => {
        return [
          k,
          Object.values(v["nerdEmojis"]).reduce((sum, a) => sum + a, 0) ?? 0,
        ];
      })
      .sort((f, s) => {
        return s[1] - f[1];
      })[0];

    const topScores = Object.entries(guildStats)
      .filter((k) => k[0].length == 18)
      .map(([k, v]) => {
        return [k, v["score"]];
      })
      .sort((f, s) => {
        return s[1] - f[1];
      });

    const reputations = Object.entries(guildStats)
      .filter((k) => k[0].length == 18)
      .map(([k, v]) => {
        return [k, v["reputation"] ?? 0];
      });
    const topReputation = reputations.sort((f, s) => {
      return s[1] - f[1];
    })[0];
    const bottomReputation = reputations.sort((f, s) => {
      return f[1] - s[1];
    })[0];

    var outputMessage = `Top nerder: ${module.exports.getNickname(
      msg,
      topNerder[0]
    )} (${
      topNerder[1]
    } emojis given)\nMost nerded: ${module.exports.getNickname(
      msg,
      topNerded[0]
    )} (${
      topNerded[1]
    } emojis received)\nHighest reputation: ${module.exports.getNickname(
      msg,
      topReputation[0]
    )} (${
      topReputation[1]
    } reputation)\nLowest reputation: ${module.exports.getNickname(
      msg,
      bottomReputation[0]
    )} (${bottomReputation[1]} reputation)\n\n`;

    const table = new Table({
      columns: [
        { name: "#" },
        { name: "Name", alignment: "left" },
        { name: "Msgs" },
        { name: "Time" },
        { name: "Rep" },
        { name: "Rank", alignment: "left" },
      ],
    });
    var stars = [];

    topScores
      .slice(second ? 5 : 0, Math.min(second ? 10 : 5, topScores.length))
      .forEach((a, i) => {
        const name = module.exports.getNickname(msg, a[0]);

        table.addRow({
          "#": i + (second ? 6 : 1),
          Name: name,
          Msgs:
            guildStats[a[0]]["messages"] + guildStats[a[0]]["previousMessages"],
          Time: module.exports.formatTime(
            guildStats[a[0]]["voiceTime"] +
              guildStats[a[0]]["previousVoiceTime"]
          ),
          Rep: module.exports.formatReputation(
            module.exports.addLeadingZero(guildStats[a[0]]["reputation"] ?? 0)
          ),
          Rank: `${module.exports.getRanking(guildStats[a[0]])} (${a[1]}SR)`,
        });

        stars.push(guildStats[a[0]]["prestige"] ?? 0);
      });

    var splitRender = table.render().split("\n");

    for (var i = 3; i < splitRender.length - 1; i++) {
      splitRender[i] += ` \u001b[33m${"★".repeat(stars[i - 3])}\u001b[0m`;
    }

    outputMessage += splitRender.join("\n") + "\n";

    const userRanking = topScores
      .map((a, i) => [a[0], a[1], i])
      .filter((a) => a[0] == msg.author.id)[0];
    if (userRanking) {
      outputMessage += `\nYour ranking (${module.exports.getNickname(
        msg,
        userRanking[0]
      )}): #${userRanking[2] + 1} (${module.exports.getRanking(
        guildStats[userRanking[0]]
      )}, ${userRanking[1]}SR)`;
    }

    msg.reply("```ansi\n" + outputMessage + "\n```");

    if (!second) module.exports.run([null, msg], true);
  },
  addLeadingZero: (num) => {
    if (num > -10 && num < 10) {
      return num >= 0 ? `0${num}` : `-0${Math.abs(num)}`;
    }
    return num;
  },
  formatTime: (seconds) => {
    // note: this will only work up to 30d 23h 59m 59s
    // this is because toISOString() returns 1970-01-01T03:12:49.000Z (eg)
    // if anybody hits this, gold star - 11/02/24
    var date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString().substr(8, 11).split(/:|T/);
    return `${parseInt(unitArray[0]) - 1 > 9 ? "" : " "}${
      parseInt(unitArray[0]) - 1
    }d ${unitArray[1]}h ${unitArray[2]}m ${unitArray[3]}s`;
  },
  formatReputation: (rep) => {
    return `${
      rep > 0 ? "\u001b[1;32m" : rep < 0 ? "\u001b[1;31m" : ""
    }${rep}\u001b[0m`;
  },
  getPrestige: (memberStats) => {
    return `\u001b[33m${"★".repeat(memberStats["prestige"] ?? 0)}\u001b[0m`;
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return `${member.displayName}`;
  },
  getRanking: (memberStats) => {
    var rankString = "MISSINGNO";
    Object.entries(ranks).forEach(([k, v]) => {
      if (v[0] <= memberStats["score"]) {
        rankString = `${v[1]}${k}\u001b[0m`;
      }
    });
    return rankString;
  },
};
