const axios = require("axios");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

class PhotoEnhancer {
    constructor() {
        this.cfg = {
            base: "https://photoenhancer.pro",
            end: {
                enhance: "/api/enhance",
                status: "/api/status",
                removeBg: "/api/remove-background",
                upscale: "/api/upscale"
            },
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://photoenhancer.pro",
                referer: "https://photoenhancer.pro/",
                "user-agent":
                    "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/127 Mobile"
            }
        };
    }

    wait(ms) {
        return new Promise(r => setTimeout(r, ms || 3000));
    }

    async img(input) {
        if (!input) return null;
        if (Buffer.isBuffer(input)) {
            return `data:image/jpeg;base64,${input.toString("base64")}`;
        }
        return input;
    }

    async poll(id) {
        for (let i = 0; i < 60; i++) {
            await this.wait();
            const { data } = await axios.get(
                `${this.cfg.base}${this.cfg.end.status}`,
                {
                    params: { id },
                    headers: this.cfg.headers
                }
            );
            if (data?.status === "succeeded") return data;
            if (data?.status === "failed") throw new Error("Processing failed");
        }
        throw new Error("Processing timeout");
    }

    async generate({ imageUrl, type }) {
        const imageData = await this.img(imageUrl);
        let endpoint = this.cfg.end.enhance;
        let body = { imageData, mode: "ultra", fileName: "image.png" };

        if (type === "remove-bg") {
            endpoint = this.cfg.end.removeBg;
            body = { imageData };
        }

        if (type === "upscale") {
            endpoint = this.cfg.end.upscale;
            body = { imageData, targetResolution: "4K" };
        }

        const init = await axios.post(
            `${this.cfg.base}${endpoint}`,
            body,
            { headers: this.cfg.headers }
        );

        if (init.data?.predictionId) {
            const final = await this.poll(init.data.predictionId);
            return final.resultUrl;
        }

        return init.data?.resultUrl;
    }
}

async function aiEnhanceCommand(sock, chatId, msg, args, commands, userLang) {
    try {
        let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
            key: {
                remoteJid: chatId,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
            }
        } : msg;

        const isImage = !!(quoted.message?.imageMessage || (quoted.message?.documentMessage && quoted.message.documentMessage.mimetype?.includes('image')));
        const isViewOnce = !!(quoted.message?.viewOnceMessage?.message?.imageMessage || quoted.message?.viewOnceMessageV2?.message?.imageMessage);

        if (!isImage && !isViewOnce) {
            const helpMsg = `❌ *AI Enhance - Usage Guide*

You must reply to an image to use this feature.

📌 *How to use:*
1. Send or receive an image
2. Reply to the image
3. Type one of the commands below

✨ *Available Commands*
• ${settings.prefix}ai-enhance → Enhance image quality
• ${settings.prefix}ai-enhance bg → Remove background
• ${settings.prefix}ai-enhance upscale → Upscale image to 4K

📝 *Example*
Reply to an image and type:
${settings.prefix}ai-enhance

⚠️ Notes:
• Processing takes 5–15 seconds`;
            return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
        }

        const text = args.join(' ').toLowerCase();
        let type = "enhance";

        if (text.includes("bg")) type = "remove-bg";
        if (text.includes("upscale")) type = "upscale";

        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });
        const waitMsg = userLang === 'ma'
            ? "⏳ *الذكاء كيخدم على التصويرة، صبر...*"
            : userLang === 'ar'
                ? "⏳ *جارٍ معالجة الصورة، يرجى الانتظار...*"
                : "⏳ *AI is processing your image, please wait...*";

        await sendWithChannelButton(sock, chatId, waitMsg, msg, {}, userLang);

        const buffer = await downloadMediaMessage(quoted, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error("Failed to download image.");

        const api = new PhotoEnhancer();

        const result = await api.generate({
            imageUrl: buffer,
            type
        });

        if (!result) throw new Error("Failed to process image.");

        const caption = userLang === 'ma'
            ? "✅ *العملية سالات!* (Enhanced)\n\n✨ تم تحسين الصورة بنجاح."
            : userLang === 'ar'
                ? "✅ *تمت العملية!* (Enhanced)\n\n✨ تم تحسين الصورة بنجاح."
                : "✅ *Process Completed!* (Enhanced)\n\n✨ Image enhanced successfully.";

        await sock.sendMessage(chatId, {
            image: { url: result },
            caption: caption
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (e) {
        console.error('AI Enhance Error:', e);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    }
}

module.exports = aiEnhanceCommand;
