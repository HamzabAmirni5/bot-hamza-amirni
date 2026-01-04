/*
🤖 تحليل الصور بالذكاء الاصطناعي - جيميني
By: حمزة اعمرني (Hamza Amirni)
channel: https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p
*/

const axios = require('axios');
const fetch = require('node-fetch');
const FormData = require('form-data');

// رفع إلى Gofile
const uploadToGofile = async (buffer, ext) => {
    const form = new FormData();
    form.append('file', buffer, `file.${ext}`);

    try {
        const response = await fetch('https://store2.gofile.io/uploadFile', {
            method: 'POST',
            body: form,
        });
        const result = await response.json();

        if (result.status !== 'ok' || !result.data || !result.data.downloadPage) {
            throw new Error('فشل في رفع الملف إلى Gofile.io');
        }
        return result.data.downloadPage;
    } catch (error) {
        console.error('خطأ أثناء رفع الملف إلى Gofile:', error.message);
        throw new Error(`فشل في رفع الملف: ${error.message}`);
    }
};

// رفع إلى Catbox
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
        console.log('Response Text:', text);

        if (text.startsWith('https://')) {
            return text;
        } else {
            throw new Error('فشل في رفع الملف إلى Catbox: ' + text);
        }
    } catch (error) {
        throw new Error(`فشل في رفع الملف: ${error.message}`);
    }
};

// تحليل الصورة باستخدام جيميني
const analyzeImageWithGemini = async (imageUrl, question) => {
    try {
        const encodedQuestion = encodeURIComponent(question);
        const apiUrl = `https://obito-mr-apis.vercel.app/api/ai/gemini_2.5_flash?txt=${encodedQuestion}&img=${encodeURIComponent(imageUrl)}`;

        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        throw new Error(`فشل في تحليل الصورة: ${error.message}`);
    }
};

async function handler(sock, chatId, msg, args) {
    const question = args.join(' ').trim();

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg) {
        return await sock.sendMessage(chatId, {
            text: '*⎔ ⋅ ───━ •﹝🔍 جيميني تحليل الصور ﹞• ━─── ⋅ ⎔*\n\n' +
                '📝 *الاستخدام:*\n' +
                '.جيميني-حلل السؤال\n' +
                'ثم قم بالرد على الصورة\n\n' +
                '*مثال:*\n' +
                '.جيميني-حلل ما الذي في الصورة؟\n' +
                'ثم رد على الصورة المراد تحليلها\n\n' +
                '𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈\n' +
                '*⎔ ⋅ ───━ •﹝🔍﹞• ━─── ⋅ ⎔*'
        }, { quoted: msg });
    }

    if (!question) {
        return await sock.sendMessage(chatId, {
            text: '❌ يرجى كتابة السؤال\nمثال: .جيميني-حلل ما الذي في الصورة؟'
        }, { quoted: msg });
    }

    const mime = quotedMsg?.imageMessage?.mimetype || '';

    if (!mime.startsWith('image/')) {
        return await sock.sendMessage(chatId, {
            text: '❌ يجب الرد على صورة'
        }, { quoted: msg });
    }

    try {
        const waitingMsg = await sock.sendMessage(chatId, {
            text: '🔄 جاري تحليل الصورة...\n⏳ قد يستغرق بعض الوقت'
        }, { quoted: msg });

        const img = await sock.downloadMediaMessage({
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage
        });

        if (!img) throw new Error("فشل تحميل الصورة");

        const ext = mime.split('/')[1] || 'jpg';

        let imageUrl;
        let uploadSuccess = false;

        const uploadMsg = await sock.sendMessage(chatId, {
            text: '📤 جاري رفع الصورة...'
        }, { quoted: msg });

        try {
            imageUrl = await uploadToCatbox(img, ext);
            uploadSuccess = true;
        } catch (catboxError) {
            try {
                imageUrl = await uploadToGofile(img, ext);
                uploadSuccess = true;
            } catch (gofileError) {
                throw new Error('فشل في رفع الصورة إلى جميع الخوادم');
            }
        }

        await sock.sendMessage(chatId, { delete: uploadMsg.key });

        if (!uploadSuccess || !imageUrl) {
            throw new Error('فشل في رفع الصورة');
        }

        const analysisMsg = await sock.sendMessage(chatId, {
            text: '🤖 جاري تحليل الصورة مع جيميني...'
        }, { quoted: msg });

        const result = await analyzeImageWithGemini(imageUrl, question);

        await sock.sendMessage(chatId, { delete: analysisMsg.key });

        if (!result.success || !result.result) {
            throw new Error('فشل في الحصول على تحليل');
        }

        await sock.sendMessage(chatId, { delete: waitingMsg.key });

        let responseText = '*⎔ ⋅ ───━ •﹝🤖 تحليل جيميني ﹞• ━─── ⋅ ⎔*\n\n';
        responseText += `❓ *السؤال:* ${question}\n\n`;
        responseText += `📝 *النتيجة:*\n${result.result}\n\n`;
        responseText += `⏱️ *زمن الاستجابة:* ${result.responseTime || 'غير معروف'}\n`;
        responseText += `📁 *رابط الصورة:* ${imageUrl}\n`;
        responseText += `🕐 *الوقت:* ${new Date().toLocaleString('ar-SA')}\n\n`;
        responseText += '𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈\n';
        responseText += '*⎔ ⋅ ───━ •﹝🔍﹞• ━─── ⋅ ⎔*';

        await sock.sendMessage(chatId, {
            text: responseText,
            contextInfo: {
                externalAdReply: {
                    title: "تحليل الصور بجيميني",
                    body: "𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈",
                    thumbnailUrl: imageUrl,
                    sourceUrl: "https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: msg });

    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ حدث خطأ\nالسبب: ${err.message}`
        }, { quoted: msg });
    }
}

module.exports = handler;
