const axios = require('axios');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

async function aiCheckCommand(sock, chatId, msg, args) {
    const text = args.join(' ').trim();

    if (!text) {
        const helpMsg = `🔍 *كاشف الذكاء الاصطناعي (AI Checker)* 🔍

🔹 *الاستخدام:*
${settings.prefix}aicheck [النص المراد فحصه]

📝 *مثال:*
${settings.prefix}aicheck Hello, how are you today?

💡 هذا الأمر يستخدم تقنية Turnitin لكشف ما إذا كان النص مكتوباً بواسطة ذكاء اصطناعي أم بشري.

⚔️ ${settings.botName}`;
        return await sendWithChannelButton(sock, chatId, helpMsg, msg);
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "🧠", key: msg.key } });

        const res = await axios.post(
            'https://reilaa.com/api/turnitin-match',
            { text: text },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const data = res.data;

        if (!data || !data.reilaaResult?.value) {
            throw new Error('لم يتم العثور على نتائج للفحص 😭');
        }

        const result = data.reilaaResult.value;

        const output = `✨ *نتيجة فحص الذكاء الاصطناعي* ✨

🧠 *التصنيف:* ${result.classification === 'AI' ? 'ذكاء اصطناعي 🤖' : 'بشري 👤'}
🎯 *نسبة الذكاء:* ${result.aiScore}%
⚠️ *المخاطر:* ${result.details.analysis.risk}
💡 *اقتراح:* ${result.details.analysis.suggestion}

📄 *النص المفحوص:*
"${result.inputText.length > 500 ? result.inputText.substring(0, 500) + '...' : result.inputText}"

⚔️ ${settings.botName}`.trim();

        await sock.sendMessage(chatId, { text: output }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (err) {
        console.error('Error in AI Check:', err);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sendWithChannelButton(sock, chatId, `❌ حدث خطأ أثناء فحص النص.\n⚠️ السبب: ${err.response?.data?.message || err.message}`, msg);
    }
}

module.exports = aiCheckCommand;
