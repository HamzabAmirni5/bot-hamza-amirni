const axios = require('axios');
const settings = require('../settings');
const { sendWithChannelButton } = require('../lib/channelButton');

/**
 * AI Labs - Image Generation Logic
 * Scrape by DAFFA
 */
const aiLabs = {
    api: {
        base: 'https://text2pet.zdex.top',
        endpoints: {
            images: '/images'
        }
    },
    headers: {
        'user-agent': 'NB Android/1.0.0',
        'accept-encoding': 'gzip',
        'content-type': 'application/json',
        authorization: ''
    },
    state: { token: null },
    setup: {
        cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
        shiftValue: 3,
        dec(text, shift) {
            return [...text].map(c =>
                /[a-z]/.test(c) ?
                    String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97) :
                    /[A-Z]/.test(c) ?
                        String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65) :
                        c
            ).join('');
        },
        decrypt: async () => {
            if (aiLabs.state.token) return aiLabs.state.token;
            const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
            aiLabs.state.token = decrypted;
            aiLabs.headers.authorization = decrypted;
            return decrypted;
        }
    },
    generateImage: async (prompt = '') => {
        // Basic validation (Original check, will use translated prompt later)
        if (!prompt?.trim()) {
            return { success: false, error: 'الوصف فارغ (Empty prompt).' };
        }

        await aiLabs.setup.decrypt();
        try {
            const payload = { prompt };
            const url = aiLabs.api.base + aiLabs.api.endpoints.images;
            const res = await axios.post(url, payload, { headers: aiLabs.headers });

            if (res.data.code !== 0 || !res.data.data) {
                return { success: false, error: 'فشل توليد الصورة من السيرفر.' };
            }
            return { success: true, url: res.data.data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};

async function aiImageCommand(sock, chatId, msg, args, commands, userLang) {
    const text = args.join(' ').trim();

    if (!text) {
        const helpMsg = `🎨 *توليد الصور بالذكاء الاصطناعي (AI Image Labs)* 🎨

🔹 *الاستخدام:*
\u200E${settings.prefix}ai-image [وصف الصورة]

📝 *مثال:*
\u200E${settings.prefix}ai-image قطة رائد فضاء في الفضاء

💡 يمكنك الكتابة بالعربية أو الإنجليزية، البوت سيقوم بالترجمة التلقائية.

⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg, {}, userLang);
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        // Send Wait Message
        const waitMsg = userLang === 'ma'
            ? "🎨 *كنرسم ليك فالتصويرة، بلاتي...*"
            : userLang === 'ar'
                ? "🎨 *جارٍ رسم الصورة، يرجى الانتظار...*"
                : "🎨 *Generating image, please wait...*";

        await sendWithChannelButton(sock, chatId, waitMsg, msg, {}, userLang);

        // Translate to English for better API results
        let promptToUse = text;
        try {
            const trRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
            if (trRes.data?.[0]?.[0]?.[0]) {
                promptToUse = trRes.data[0][0][0];
            }
        } catch (e) {
            console.warn('Translation failed in ai-image:', e.message);
        }

        const response = await aiLabs.generateImage(promptToUse);

        if (response.success) {
            const caption = userLang === 'ma'
                ? `✅ *ها الصورة ناضية!*\n📝 *الفكرة:* ${text}\n\n⚔️ ${settings.botName}`
                : userLang === 'ar'
                    ? `✅ *تم توليد الصورة بنجاح!*\n📝 *الوصف:* ${text}\n\n⚔️ ${settings.botName}`
                    : `✅ *Image Generated Successfully!*\n📝 *Prompt:* ${text}\n\n⚔️ ${settings.botName}`;

            await sock.sendMessage(chatId, {
                image: { url: response.url },
                caption: caption
            }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: "🎨", key: msg.key } });
        } else {
            throw new Error(response.error);
        }

    } catch (error) {
        console.error('ai-image error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        const errText = userLang === 'ma'
            ? `❌ *وقع مشكل ف الرسم.*\n⚠️ السبب: ${error.message}`
            : userLang === 'ar'
                ? `❌ فشل توليد الصورة.\n⚠️ السبب: ${error.message}`
                : `❌ Failed to generate image.\n⚠️ Reason: ${error.message}`;

        await sock.sendMessage(chatId, { text: errText }, { quoted: msg });
    }
}

module.exports = aiImageCommand;
