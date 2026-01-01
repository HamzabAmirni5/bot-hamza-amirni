const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const crypto = require('crypto');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');
const { translateToEn } = require('../lib/translate');
const { t } = require('../lib/language');

// AES configuration for Banana AI
const AES_KEY = 'ai-enhancer-web__aes-key';
const AES_IV = 'aienhancer-aesiv';

function encryptSettings(obj) {
    const key = Buffer.from(AES_KEY, 'utf8');
    const iv = Buffer.from(AES_IV, 'utf8');
    const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(obj), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// Banana AI Replacement (using robust Img2Img API)
async function bananaAI(imageBuffer, prompt) {
    try {
        // 1. Upload Buffer to get URL (since most APIs need URL)
        const { uploadImage } = require('../lib/uploadImage');
        const imageUrl = await uploadImage(imageBuffer);

        // 2. Use Ryzendesu API (Flux or Img2Img)
        const apiUrl = `https://api.ryzendesu.vip/api/ai/img2img?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const json = JSON.parse(response.data.toString());
            if (json.error) throw new Error(json.error);
        }

        return response.data; // Returns Buffer
    } catch (error) {
        throw new Error('فشل السيرفر في معالجة الصورة.');
    }
}

async function bananaAiCommand(sock, chatId, msg, args, commands, userLang) {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        key: {
            remoteJid: chatId,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        }
    } : msg;

    const isImage = !!(quoted.message?.imageMessage || (quoted.message?.documentMessage && quoted.message.documentMessage.mimetype?.includes('image')));
    const prompt = args.join(' ').trim();

    if (!isImage) {
        const helpMsg = `🍌 *Banana AI - محرر الصور المتقدم* 🍌\r\n\r\n🔹 *الاستخدام:*\r\nقم بالرد على صورة مع كتابة الوصف.\r\n• مثال: .banana make it a cartoon\r\n\r\n⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
    }

    if (!prompt) {
        return await sock.sendMessage(chatId, { text: t('ai.provide_prompt', {}, userLang) }, { quoted: msg });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "🍌", key: msg.key } });

        const buffer = await downloadMediaMessage(quoted, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error("تعذر تحميل الصورة");

        // Translate to English
        const translatedPrompt = await translateToEn(prompt);

        const resultBuffer = await bananaAI(buffer, translatedPrompt);
        await sock.sendMessage(chatId, { image: resultBuffer, caption: `✅ *تم التعديل بنجاح!*\n📝 *الوصف:* ${prompt}` }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error('Error in Banana AI:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sendWithChannelButton(sock, chatId, t('ai.error', {}, userLang) + `\n⚠️ السبب: ${error.message}`, msg);
    }
}

module.exports = bananaAiCommand;
