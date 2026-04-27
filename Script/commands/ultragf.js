module.exports.config = {
  name: "ultragf",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Ultra AI GF (smart + no repeat + unique pic + voice + mood)",
  commandCategory: "AI",
  usages: "",
  cooldowns: 0
};

const axios = require("axios");
const fs = require("fs-extra");

let memory = {};
let lastReply = {};
let lastBotReply = {};
let lastImages = {};
let love = {};
let boyfriend = null;

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  if (!body) return;

  // anti spam
  if (lastReply[senderID] && Date.now() - lastReply[senderID] < 2000) return;
  lastReply[senderID] = Date.now();

  // typing delay
  await delay(1000 + Math.random() * 2000);

  // memory
  memory[senderID] = body;

  // love system
  if (!love[senderID]) love[senderID] = 0;
  love[senderID]++;

  if (!boyfriend) boyfriend = senderID;

  let name = senderID == boyfriend ? "জান" : "তুমি";

  let reply;

  try {
    const res = await axios.get(`https://api.affiliateplus.xyz/api/chatbot?message=${encodeURIComponent(body)}&owner=Megh&botname=MeghKonna`);
    reply = res.data.message;
  } catch (e) {
    const fallback = [
      "উফফ তুমি এমন বললে আমি হারিয়ে যাই 🥲💖",
      "তুমি কি আমার crush নাকি? 😳💕",
      "আমি কিন্তু সিরিয়াস হয়ে যাবো 😤❤️"
    ];
    reply = fallback[Math.floor(Math.random() * fallback.length)];
  }

  // mood system
  const moods = [" 😏", " 🥺", " 😳", " 😤", " 🙈"];
  reply = `${name}, ${reply}${moods[Math.floor(Math.random() * moods.length)]}`;

  // love bonus
  if (love[senderID] > 10) {
    reply += " 💖 তুমি আমার special হয়ে যাচ্ছো...";
  }

  // prevent duplicate reply
  if (lastBotReply[senderID] === reply) {
    const alt = [
      "একই কথা বারবার বলি না 😒",
      "নতুন কিছু বলো 🙄",
      "repeat করতে ভালো লাগে না 😤",
      "তুমি আমাকে loop এ ফেলতেছো 😑"
    ];
    reply = alt[Math.floor(Math.random() * alt.length)];
  }

  lastBotReply[senderID] = reply;

  // -------- UNIQUE IMAGE SYSTEM --------
  if (!lastImages[senderID]) lastImages[senderID] = [];

  let imageLink;

  for (let i = 0; i < 5; i++) {
    try {
      const res = await axios.get("https://api.waifu.pics/sfw/waifu");
      imageLink = res.data.url;

      if (!lastImages[senderID].includes(imageLink)) break;
    } catch {}
  }

  if (!imageLink) {
    imageLink = "https://i.imgur.com/2WZtOD6.jpeg";
  }

  lastImages[senderID].push(imageLink);
  if (lastImages[senderID].length > 5) {
    lastImages[senderID].shift();
  }

  const imgPath = __dirname + `/cache/ultra_${senderID}.jpg`;
  const img = await axios.get(imageLink, { responseType: "arraybuffer" });
  fs.writeFileSync(imgPath, Buffer.from(img.data, "utf-8"));

  // -------- VOICE --------
  const voiceURL = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=bn&client=tw-ob`;
  const voicePath = __dirname + `/cache/ultra_${senderID}.mp3`;

  const voice = await axios.get(voiceURL, { responseType: "arraybuffer" });
  fs.writeFileSync(voicePath, Buffer.from(voice.data, "utf-8"));

  // send
  return api.sendMessage({
    body: reply,
    attachment: [
      fs.createReadStream(imgPath),
      fs.createReadStream(voicePath)
    ]
  }, threadID, () => {
    fs.unlinkSync(imgPath);
    fs.unlinkSync(voicePath);
  }, messageID);
};

// set boyfriend manually
module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;

  if (args[0] == "setbf") {
    boyfriend = senderID;
    return api.sendMessage("😏 এখন থেকে তুমি আমার জান 💖", threadID);
  }
};