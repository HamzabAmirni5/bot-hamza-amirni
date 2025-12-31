const axios = require("axios");
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');
const { uploadImage } = require('../lib/uploadImage');

/**
 * AI Image Modifier (img2img)
 * Based on VonDy API
 */
async function img2img(url, prompt) {
    try {
        // Using Ryzendesu API which is currently more stable for free img2img
        const apiUrl = `https://api.ryzendesu.vip/api/ai/img2img?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;

        // The API returns the image buffer directly or a JSON with URL depending on the endpoint variant.
        // Ryzendesu usually returns a stream or buffer. Let's check headers or try to get buffer.
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        // Check if response is valid image
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            // If it returns JSON error
            const json = JSON.parse(response.data.toString());
            if (json.error) throw new Error(json.error);
        }

        return response.data; // Return buffer directly
    } catch (error) {
        console.error("Img2Img API Error:", error.message);
        throw new Error("فشلت المعالجة من السيرفر.");
    }
}

async function aiImgEditCommand(sock, chatId, msg, args, commands, userLang) {
    let url = "";
    let prompt = "";

    // Check for quoted image or direct image
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        key: {
            remoteJid: chatId,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        }
    } : msg;

    const isImage = !!(quoted.message?.imageMessage || (quoted.message?.documentMessage && quoted.message.documentMessage.mimetype?.includes('image')));

    if (isImage) {
        prompt = args.join(" ").trim();
        if (!prompt) {
            return await sock.sendMessage(chatId, { text: "⚠️ يرجى كتابة وصف التعديل (Prompt) عند الرد على الصورة." }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        try {
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            if (!buffer) throw new Error("تعذر تحميل الصورة");

            await sendWithChannelButton(sock, chatId, "⏳ *جاري رفع الصورة ومعالجتها...*", msg);
            url = await uploadImage(buffer);
        } catch (e) {
            return await sock.sendMessage(chatId, { text: `❌ فشل رفع الصورة: ${e.message}` }, { quoted: msg });
        }
    } else {
        // Handling via URL | Prompt or URL Prompt
        const fullText = args.join(" ");
        if (fullText.includes("|")) {
            [url, prompt] = fullText.split("|").map(str => str.trim());
        } else if (args.length >= 2) {
            url = args[0];
            prompt = args.slice(1).join(" ");
        }
    }

    if (!url || !prompt) {
        const helpMsg = `🎨 *معدل الصور الاحترافي (VonDy AI)* 🎨

🔹 *الاستخدام:*
1️⃣ رُد على صورة واكتب التعديل:
   ${settings.prefix}ai-img-edit اجعل الشخص يرتدي نظارة

2️⃣ أو استعمل رابط صورة مباشر:
   ${settings.prefix}ai-img-edit [رابط] | [الوصف]

⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
    }

    // Validate URL if not already done via upload
    if (!url.startsWith("http")) {
        return await sock.sendMessage(chatId, { text: "❌ يرجى تقديم رابط صورة صحيح أو الرد على صورة." }, { quoted: msg });
    }

    try {
        if (!isImage) await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        // Translate prompt to English
        let translatedPrompt = prompt;
        try {
            const trRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(prompt)}`);
            if (trRes.data?.[0]?.[0]?.[0]) translatedPrompt = trRes.data[0][0][0];
        } catch (e) { }

        const resultBuffer = await img2img(url, translatedPrompt);

        await sock.sendMessage(chatId, {
            image: resultBuffer,
            caption: `✅ *تم تعديل الصورة بنجاح!*\n📝 *التعديل:* ${prompt}\n\n⚔️ ${settings.botName}`
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error('ai-img-edit error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sock.sendMessage(chatId, { text: "❌ وقع خطأ أثناء معالجة الصورة. جرب مرة أخرى لاحقاً." }, { quoted: msg });
    }
}

module.exports = aiImgEditCommand;
