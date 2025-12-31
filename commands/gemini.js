const axios = require("axios");
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

async function geminiCommand(sock, chatId, message, args) {
    try {
        const query = Array.isArray(args) ? args.join(' ') : args;

        if (!query || query.trim().length === 0) {
            const helpMsg = userLang === 'ma'
                ? `🤖 *Google Gemini AI*\n\n📝 *الاستخدام:*\n${settings.prefix}gemini [سؤالك]\n\n💡 *مثال:*\n${settings.prefix}gemini شنو هي أفضل طريقة لتعلم البرمجة؟\n\n⚔️ ${settings.botName}`
                : userLang === 'ar'
                    ? `🤖 *Google Gemini AI*\n\n📝 *الاستخدام:*\n${settings.prefix}gemini [سؤالك]\n\n💡 *مثال:*\n${settings.prefix}gemini ما هي أفضل طريقة لتعلم البرمجة؟\n\n⚔️ ${settings.botName}`
                    : `🤖 *Google Gemini AI*\n\n📝 *Usage:*\n${settings.prefix}gemini [question]\n\n💡 *Example:*\n${settings.prefix}gemini Explain quantum computing\n\n⚔️ ${settings.botName}`;

            return await sendWithChannelButton(sock, chatId, helpMsg, message);
        }

        // React with 🤖 while processing
        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key }
        });

        // Send thinking message
        const thinkMsg = userLang === 'ma'
            ? "🤖 *Gemini كيفكر، بلاتي...*"
            : userLang === 'ar'
                ? "🤖 *Gemini يفكر، يرجى الانتظار...*"
                : "🤖 *Gemini is thinking...*";
        await sock.sendMessage(chatId, { text: thinkMsg }, { quoted: message });

        const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(query)}&model=deepseek`;

        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (response.data && response.data.success && response.data.message?.content) {
            const answer = response.data.message.content;
            await sock.sendMessage(chatId, { text: `🤖 *Gemini:*\n\n${answer}` }, { quoted: message });
        } else {
            throw new Error("Invalid Gemini response");
        }
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        const errMsg = userLang === 'ma'
            ? "❌ *تعكسات الأمور. عاود جرب من بعد.*"
            : userLang === 'ar'
                ? "❌ *فشل الاتصال بـ Gemini. حاول لاحقاً.*"
                : "❌ *Gemini failed. Try again later.*";
        await sock.sendMessage(chatId, { text: errMsg }, { quoted: message });
    }
}

module.exports = geminiCommand;
