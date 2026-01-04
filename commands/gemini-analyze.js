/*
🤖 تحليل الصور بالذكاء الاصطناعي - جيميني
By: حمزة اعمرني (Hamza Amirni)
channel: https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p
*/

const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const axios = require('axios');
const fetch = require('node-fetch');
const FormData = require('form-data');

// رفع إلى Catbox (أكثر استقراراً)
const uploadToCatbox = async (buffer, ext) => {
    const form = new FormData();
    form.append('fileToUpload', buffer, `file.${ext}`);
    form.append('reqtype', 'fileupload');

    try {
        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: form,
        });
        const text = await response.text();
        if (text.startsWith('https://')) return text;
        throw new Error('Catbox Upload Failed: ' + text);
    } catch (error) {
        throw new Error(`Upload Error: ${error.message}`);
    }
};

// تحليل الصورة باستخدام جيميني مع عدة محاولات (Fallbacks)
const analyzeImageWithGemini = async (imageUrl, question) => {
    const encQ = encodeURIComponent(question);
    const encImg = encodeURIComponent(imageUrl);

    const apis = [
        `https://obito-mr-apis.vercel.app/api/ai/gemini_2.5_flash?txt=${encQ}&img=${encImg}`,
        `https://api.vreden.web.id/api/gemini-vision?image=${encImg}&query=${encQ}`,
        `https://api.shizuhub.me/vision/gemini?image=${encImg}&prompt=${encQ}`
    ];

    for (let api of apis) {
        try {
            console.log('Trying Gemini API:', api);
            const res = await axios.get(api, { timeout: 30000 });
            let data = res.data;

            let result = typeof data === 'string' ? data : (data.result || data.data || data.content || data.response);

            if (result && result !== "{}" && typeof result === 'string') {
                return result;
            }
        } catch (e) {
            console.error(`Gemini API Failed (${api}):`, e.message);
            continue;
        }
    }

    throw new Error('فشل تحليل الصورة حالياً.');
};

async function handler(sock, chatId, msg, args) {
    const question = args.join(' ').trim() || "ماذا يوجد في هذه الصورة؟";

    let targetMsg = msg;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedInfo = msg.message.extendedTextMessage.contextInfo;
        targetMsg = {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mime = targetMsg.message?.imageMessage?.mimetype || '';

    if (!mime.startsWith('image/')) {
        return await sock.sendMessage(chatId, {
            text: '*✨ ──────────────── ✨*\n🤖 *جيميني تحليل الصور* 🤖\n\n📌 *يرجى الرد على صورة بـ:*\n.جيميني-حلل [السؤال]\n*✨ ──────────────── ✨*'
        }, { quoted: msg });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        const img = await downloadMediaMessage(targetMsg, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!img) throw new Error("فشل تحميل الصورة");
        const ext = mime.split('/')[1] || 'jpg';

        const { key } = await sock.sendMessage(chatId, { text: "🔄 جاري التحليل بذكاء جيميني..." }, { quoted: msg });

        const imageUrl = await uploadToCatbox(img, ext);
        const result = await analyzeImageWithGemini(imageUrl, question);

        await sock.sendMessage(chatId, { delete: key });

        let responseText = `*✨ ───❪ HAMZA AMIRNI ❫─── ✨*\n\n`;
        responseText += `📝 *النتيجة:* \n${result}\n\n`;
        responseText += `*HAMZA AMIRNI AI*`;

        await sock.sendMessage(chatId, {
            text: responseText,
            contextInfo: {
                externalAdReply: {
                    title: "Gemini AI Vision",
                    body: "𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈",
                    thumbnailUrl: imageUrl,
                    sourceUrl: "https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (err) {
        console.error('Gemini Analyze Error:', err);
        await sock.sendMessage(chatId, { text: `❌ *خطأ:* ${err.message}` }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    }
}

module.exports = handler;
