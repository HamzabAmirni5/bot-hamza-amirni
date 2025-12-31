const { vocalRemove } = require('../lib/vocalRemover');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

async function vocalRemoverCommand(sock, chatId, msg, args) {
    let quoted = msg.quoted ? msg.quoted : msg;
    let mime = (quoted.msg || quoted).mimetype || '';

    if (!/audio/.test(mime) && !/video/.test(mime)) {
        const helpMsg = `🎤 *عازل الصوت (Vocal Remover)* 🎤

🔹 *الاستخدام:*
رد على شي أوديو ولا فيديو بهاد الكوموند:
${settings.prefix}3azlsawt
أو
${settings.prefix}hazf-sawt

💡 البوت كايخدم بالذكاء الاصطناعي باش يحيد الموسيقى ويخلي غير صوت المغني، ولا العكس.
⚠️ نصيحة: من الأحسن المقطع ما يفوتش 2 دقايق باش تخرج النتيجة ناضية وبزربة.

⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg);
    }

    try {
        await sendWithChannelButton(sock, chatId, '⏳ *جاري معالجة المقطع وفصل الصوت عن الموسيقى...*\nيرجى التحلي بالصبر، هذه العملية قد تستغرق دقيقة أو أكثر.', msg);

        // React with 🎧
        await sock.sendMessage(chatId, { react: { text: "🎧", key: msg.key } });

        const media = await (quoted.download ? quoted.download() : sock.downloadMediaMessage(quoted));
        if (!media) throw new Error("تعذر تحميل المقطع");

        const { vocal_path, instrumental_path } = await vocalRemove(media);

        if (!vocal_path || !instrumental_path) {
            throw new Error("فشل استخراج الروابط من الخادم.");
        }

        // Send Vocals
        await sock.sendMessage(chatId, {
            audio: { url: vocal_path },
            mimetype: 'audio/mpeg',
            fileName: 'Vocals.mp3',
            caption: '🎤 *صوت المغني فقط (Vocals)*'
        }, { quoted: msg });

        // Send Instrumental
        await sock.sendMessage(chatId, {
            audio: { url: instrumental_path },
            mimetype: 'audio/mpeg',
            fileName: 'Instrumental.mp3',
            caption: '🎸 *الموسيقى فقط (Instrumental)*'
        }, { quoted: msg });

        // React with check
        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error('Error in Vocal Remover:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sendWithChannelButton(sock, chatId, `❌ فشلت العملية.\n⚠️ السبب: ${error.message || 'خطأ في الخادم أو المقطع كبير جداً'}`, msg);
    }
}

module.exports = vocalRemoverCommand;
