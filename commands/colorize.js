const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

class ImageColorizer {
    constructor() {
        this.cfg = {
            upUrl: "https://photoai.imglarger.com/api/PhoAi/Upload",
            ckUrl: "https://photoai.imglarger.com/api/PhoAi/CheckStatus",
            hdrs: {
                accept: "application/json, text/plain, */*",
                origin: "https://imagecolorizer.com",
                referer: "https://imagecolorizer.com/",
                "user-agent":
                    "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/127 Mobile Safari/537.36"
            }
        }
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms))
    }

    base64(str) {
        return Buffer.from(str || "").toString("base64")
    }

    async getBuffer(input) {
        if (Buffer.isBuffer(input)) return input
        if (typeof input === "string" && input.startsWith("http")) {
            const res = await axios.get(input, { responseType: "arraybuffer" })
            return Buffer.from(res.data)
        }
        throw new Error("Invalid image input")
    }

    async upload(buffer, params) {
        const form = new FormData()
        form.append("file", buffer, {
            filename: "image.jpg",
            contentType: "image/jpeg"
        })
        form.append("type", 17)
        form.append("restore_face", "false")
        form.append("upscale", "false")
        form.append("positive_prompts", params.pos)
        form.append("negative_prompts", params.neg)
        form.append("scratches", "false")
        form.append("portrait", "false")
        form.append("color_mode", "2")

        const res = await axios.post(this.cfg.upUrl, form, {
            headers: { ...this.cfg.hdrs, ...form.getHeaders() }
        })

        return res?.data?.data
    }

    async check(code, type) {
        const res = await axios.post(
            this.cfg.ckUrl,
            { code, type },
            {
                headers: {
                    ...this.cfg.hdrs,
                    "content-type": "application/json"
                }
            }
        )
        return res?.data
    }

    async generate(imageBuffer, prompt) {
        const posPrompt =
            (prompt || "") +
            ", masterpiece, high quality, sharp, 8k photography"
        const negPrompt =
            "black and white, blur, grain, sepia, low quality"

        const task = await this.upload(imageBuffer, {
            pos: this.base64(posPrompt),
            neg: this.base64(negPrompt)
        })

        if (!task?.code) throw new Error("Failed to get task code")

        for (let i = 0; i < 60; i++) {
            await this.sleep(3000)
            const status = await this.check(task.code, task.type || 17)
            if (status?.data?.status === "success") {
                return status.data.downloadUrls[0]
            }
        }

        throw new Error("Processing timeout")
    }
}

async function colorizeCommand(sock, chatId, msg, args, commands, userLang) {
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
            const helpMsg = `🎨 *AI Image Colorizer*

This feature uses AI to restore and colorize black & white photos.

━━━━━━━━━━━━━━━━━━
🧑‍💻 HOW TO USE
━━━━━━━━━━━━━━━━━━
1️⃣ Reply to a black & white image
2️⃣ Send the command:
${settings.prefix}colorize

Optional:
${settings.prefix}colorize <custom prompt>

━━━━━━━━━━━━━━━━━━
📂 SUPPORTED INPUT
━━━━━━━━━━━━━━━━━━
• JPG / JPEG
• PNG
• Black & white photos
• Old photos

━━━━━━━━━━━━━━━━━━
📝 EXAMPLES
━━━━━━━━━━━━━━━━━━
.colorize
.colorize realistic colors
.colorize vintage style

━━━━━━━━━━━━━━━━━━
⚠️ NOTES
━━━━━━━━━━━━━━━━━━
• One image per command
• Processing takes 10–30 seconds
• Works best on clear faces
• Daily usage limits may apply`;
            return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
        }

        const userPrompt = args.join(" ");

        await sock.sendMessage(chatId, { react: { text: "🎨", key: msg.key } });
        const waitMsg = userLang === 'ma'
            ? "🎨 *كنلون فالتصويرة، بلاتي...*"
            : userLang === 'ar'
                ? "🎨 *جارٍ تلوين الصورة، يرجى الانتظار...*"
                : "🎨 *Colorizing image, please wait...*";

        await sendWithChannelButton(sock, chatId, waitMsg, msg, {}, userLang);

        const buffer = await downloadMediaMessage(quoted, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error("Failed to download image.");

        const api = new ImageColorizer();
        const resultUrl = await api.generate(buffer, userPrompt);

        const caption = userLang === 'ma'
            ? "✅ *العملية سالات!* (Colorized)\n\n🎨 تم تلوين الصورة بنجاح."
            : userLang === 'ar'
                ? "✅ *تمت العملية!* (Colorized)\n\n🎨 تم تلوين الصورة بنجاح."
                : "✅ *Process Completed!* (Colorized)\n\n🎨 Image colorized successfully.";

        await sock.sendMessage(chatId, {
            image: { url: resultUrl },
            caption: caption
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (e) {
        console.error('Colorize Error:', e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sock.sendMessage(chatId, { text: "❌ Failed to colorize image:\n" + e.message }, { quoted: msg });
    }
}

module.exports = colorizeCommand;
