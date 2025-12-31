const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function img2img(url, prompt) {
    try {
        const apiUrl = `https://api.ryzendesu.vip/api/ai/img2img?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const json = JSON.parse(response.data.toString());
            if (json.error) throw new Error(json.error);
        }

        return response.data;
    } catch (error) {
        console.error("Img2Img API Error:", error.message);
        throw new Error("فشلت المعالجة من السيرفر. (API Down)");
    }
}

async function nanobananaproCommand(sock, chatId, msg, args) {
    try {
        let q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ?
            msg.message.extendedTextMessage.contextInfo.quotedMessage :
            msg.message;

        let quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let mime = (quotedMsg?.imageMessage || msg.message?.imageMessage)?.mimetype || '';

        if (!mime || !/image/.test(mime)) {
            return sock.sendMessage(chatId, {
                text: "⚠️ يرجى الرد على *صورة* مع كتابة التعديل المطلوب.\nمثال: .nanobananapro غير لون الشعر للأسود"
            }, { quoted: msg });
        }

        const prompt = args.join(' ');
        if (!prompt) {
            return sock.sendMessage(chatId, {
                text: "⚠️ يرجى كتابة ما تريد تعديله في الصورة.\nمثال: .nanobananapro ارفع جودة الصورة وغير الخلفية"
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });
        await sock.sendMessage(chatId, { text: "⏳ *جاري معالجة الصورة...* يرجى الانتظار." }, { quoted: msg });

        // Prepare image for download
        let targetMessage = msg;
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedInfo = msg.message.extendedTextMessage.contextInfo;
            targetMessage = {
                key: {
                    remoteJid: chatId,
                    id: quotedInfo.stanzaId,
                    participant: quotedInfo.participant
                },
                message: quotedInfo.quotedMessage
            };
        }

        const imageBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!imageBuffer) throw new Error('Failed to download image');

        // Translate prompt
        let translatedPrompt = prompt;
        try {
            const trRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(prompt)}`);
            if (trRes.data?.[0]?.[0]?.[0]) translatedPrompt = trRes.data[0][0][0];
        } catch (e) { }

        // Upload to get URL
        const imageUrl = await uploadImage(imageBuffer);

        // Execute edit
        const resultBuffer = await img2img(imageUrl, translatedPrompt);

        await sock.sendMessage(chatId, {
            image: resultBuffer,
            caption: `✅ *تم التعديل بنجاح!*\n\n📝 *الطلب:* ${prompt}\n👤 *By:* Hamza Amirni\n⚔️ *Hamza Amirni Bot*`
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sock.sendMessage(chatId, { text: "❌ فشل التعديل: " + (e.message || "خطأ غير معروف") }, { quoted: msg });
    }
}

module.exports = nanobananaproCommand;
