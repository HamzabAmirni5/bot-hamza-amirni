const axios = require("axios");
const { t } = require('../lib/language');

async function gptCommand(sock, chatId, message, args, commands, userLang) {
    try {
        const query = Array.isArray(args) ? args.join(' ') : args;

        if (!query || query.trim().length === 0) {
            const helpMsg = userLang === 'ma'
                ? `🤖 *GPT-4o*\n\n📝 *الاستخدام:*\n${settings.prefix}gpt [سؤالك]\n\n⚔️ ${settings.botName}`
                : userLang === 'ar'
                    ? `🤖 *GPT-4o*\n\n📝 *الاستخدام:*\n${settings.prefix}gpt [سؤالك]\n\n⚔️ ${settings.botName}`
                    : `🤖 *GPT-4o*\n\n📝 *Usage:*\n${settings.prefix}gpt [question]\n\n⚔️ ${settings.botName}`;

            return await sock.sendMessage(chatId, {
                text: helpMsg
            }, { quoted: message });
        }

        // React with 🤖 while processing
        await sock.sendMessage(chatId, {
            react: { text: "🤖", key: message.key }
        });

        // Thinking message
        const thinkMsg = userLang === 'ma' ? "🤖 *GPT كيفكر...*" : "🤖 *GPT is thinking...*";
        await sock.sendMessage(chatId, { text: thinkMsg }, { quoted: message });

        const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(query)}&model=gpt-4.5`;

        const response = await axios.get(apiUrl);

        if (response.data && response.data.success && response.data.message?.content) {
            const answer = response.data.message.content;
            await sock.sendMessage(chatId, { text: `🤖 *GPT Chat:*\n\n${answer}` }, { quoted: message });
        } else {
            throw new Error("Invalid GPT response");
        }
    } catch (error) {
        console.error("GPT API Error:", error.message);
        const errMsg = userLang === 'ma' ? "❌ *فشل GPT. عاود جرب.*" : "❌ *GPT Error. Try again.*";
        await sock.sendMessage(chatId, { text: errMsg }, { quoted: message });
    }
}

module.exports = gptCommand;
