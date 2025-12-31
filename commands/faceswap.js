const DailyAPI = require('../lib/dailyApi');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

async function faceswapCommand(sock, chatId, msg, args) {
    let quoted = msg.quoted ? msg.quoted : msg;
    const isImage = quoted.mtype === 'imageMessage' || (quoted.msg && quoted.msg.mimetype && quoted.msg.mimetype.includes('image'));

    if (!isImage) {
        const helpMsg = `🎭 *تبديل الوجوه (Face Swap)* 🎭

🔹 *كيفية الاستخدام:*
1. أرسل صورة الشخص الذي تريد أخذ وجهه.
2. قم بالرد على تلك الصورة بصورة أخرى (الشخص الذي سيوضع عليه الوجه) مع كتابة الأمر:
   *${settings.prefix}faceswap*

أو قم بالرد على صورة واحدة بالأمر، وسيقوم البوت بطلب الصورة الثانية.

💡 *ملاحظة:* لنتائج أفضل، تأكد من وضوح الوجوه في كلا الصورتين.

⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg);
    }

    // This is a simplified version. A robust version would wait for a second image.
    // However, we can use the quoted image as TARGET and if there's no other image, 
    // maybe we can guide the user or check if there are two images in the same flow.

    // Let's assume the user replies to image A with image B + command.
    // image B (current message) is SOURCE, image A (quoted) is TARGET.

    const sourceImage = msg.mtype === 'imageMessage' ? msg : null;
    const targetImage = msg.quoted && msg.quoted.mtype === 'imageMessage' ? msg.quoted : null;

    if (!sourceImage || !targetImage) {
        return await sendWithChannelButton(sock, chatId, `❌ يرجى إرسال صورة والرد عليها بصورة أخرى مع الأمر لتنفيذ عملية تبديل الوجوه.`, msg);
    }

    try {
        await sendWithChannelButton(sock, chatId, '⏳ *جاري تبديل الوجوه...* قد يستغرق الأمر بعض الوقت.', msg);

        const sourceBuffer = await sock.downloadMediaMessage(sourceImage);
        const targetBuffer = await sock.downloadMediaMessage(targetImage);

        const api = new DailyAPI();
        const result = await api.generate({
            mode: 'swap',
            source: sourceBuffer,
            target: targetBuffer
        });

        if (result.error) {
            throw new Error(result.msg);
        }

        if (result.success && result.buffer) {
            await sock.sendMessage(chatId, {
                image: result.buffer,
                caption: `✅ *تم تبديل الوجوه بنجاح!*\\n\\n⚔️ ${settings.botName}`
            }, { quoted: msg });
        } else {
            throw new Error("لم يتم استلام أي صورة من الخادم.");
        }

    } catch (error) {
        console.error('Error in Face Swap:', error);
        await sendWithChannelButton(sock, chatId, `❌ فشل تبديل الوجوه.\n⚠️ السبب: ${error.message || 'خطأ غير معروف'}`, msg);
    }
}

module.exports = faceswapCommand;
