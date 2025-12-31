const axios = require("axios");
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');
const { uploadImage } = require('../lib/uploadImage');

/**
 * AI Image Modifier (img2img)
 * Uses Ryzendesu API (more stable)
 */
/**
 * AI Image Modifier (img2img)
 * Uses Pollinations AI (Stable & Free)
 */
async function img2img(url, prompt) {
    try {
        // Pollinations supports img2img by passing 'image' parameter
        // Ensure prompt is URL encoded
        const enPrompt = encodeURIComponent(prompt);
        const imageUrl = encodeURIComponent(url);

        // Using Flux model by default for good quality
        const apiUrl = `https://image.pollinations.ai/prompt/${enPrompt}?image=${imageUrl}&width=1024&height=1024&model=flux&nologo=true`;

        console.log(`[Edit] Calling Pollinations with: ${apiUrl}`);

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        // Verify content type
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const json = JSON.parse(response.data.toString());
            if (json.error) throw new Error(json.error);
        }

        return response.data;
    } catch (error) {
        console.error("Img2Img API Error:", error.message);
        throw new Error("فشلت معالجة الصورة (Pollinations Error).");
    }
}

async function editCommand(sock, chatId, msg, args, commands, userLang) {
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
            const errPpt = userLang === 'ma'
                ? "⚠️ *خصك تكتب شنو بغيتي تبدل فالتصويرة!*\n📝 مثال: .edit اجعل السماء حمراء"
                : userLang === 'ar'
                    ? "⚠️ *يرجى كتابة وصف التعديل!*\n📝 مثال: .edit اجعل السماء حمراء"
                    : "⚠️ *Please specify what to edit!*\n📝 Example: .edit make the sky red";
            return await sock.sendMessage(chatId, { text: errPpt }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        try {
            const { downloadMediaMessage } = require('@whiskeysockets/baileys');
            const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            if (!buffer) throw new Error("تعذر تحميل الصورة");

            const processingMsg = userLang === 'ma'
                ? "⏳ *جاري رفع الصورة ومعالجتها... صبر عشيري*"
                : userLang === 'ar'
                    ? "⏳ *جاري رفع الصورة ومعالجتها...*"
                    : "⏳ *Uploading and processing image...*";

            await sendWithChannelButton(sock, chatId, processingMsg, msg, {}, userLang);
            url = await uploadImage(buffer);
        } catch (e) {
            return await sock.sendMessage(chatId, { text: `❌ فشل رفع الصورة: ${e.message}` }, { quoted: msg });
        }
    } else {
        const helpMsg = userLang === 'ma'
            ? `🎨 *محرر الصور الذكي (Edit AI)* 🎨\n\n🔹 *الاستخدام:*\nجاوب على شي تصويرة وكتب:\n${settings.prefix}edit [شنو بغيتي تبدل]\n\n⚔️ ${settings.botName}`
            : userLang === 'ar'
                ? `🎨 *محرر الصور الذكي (Edit AI)* 🎨\n\n🔹 *الاستخدام:*\nقم بالرد على صورة واكتب:\n${settings.prefix}edit [التعديل المطلوب]\n\n⚔️ ${settings.botName}`
                : `🎨 *AI Image Editor (Edit AI)* 🎨\n\n🔹 *Usage:*\nReply to an image with:\n${settings.prefix}edit [prompt]\n\n⚔️ ${settings.botName}`; // Keep concise
        return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
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

        const caption = userLang === 'ma'
            ? `✅ *تم تعديل الصورة بنجاح!*\n📝 *التعديل:* ${prompt}\n\n⚔️ ${settings.botName}`
            : userLang === 'ar'
                ? `✅ *تم تعديل الصورة بنجاح!*\n📝 *التعديل:* ${prompt}\n\n⚔️ ${settings.botName}`
                : `✅ *Image Edited Successfully!*\n📝 *Prompt:* ${prompt}\n\n⚔️ ${settings.botName}`;

        await sock.sendMessage(chatId, {
            image: resultBuffer,
            caption: caption
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error('edit command error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        const errMsg = userLang === 'ma'
            ? "❌ *وقع خطأ أثناء معالجة الصورة.*"
            : "❌ *Error processing image.*";

        await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
    }
}


module.exports = editCommand;
