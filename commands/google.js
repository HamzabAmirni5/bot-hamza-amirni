const axios = require('axios');
const settings = require('../settings');

async function googleCommand(sock, chatId, msg, args) {
    const query = args.join(' ');
    if (!query) {
        return await sock.sendMessage(chatId, { text: `🔍 يرجى إدخال كلمة البحث!\nمثال: ${settings.prefix}google WhatsApp Bot` }, { quoted: msg });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🌐', key: msg.key } });

        // Update to correct endpoint
        const response = await axios.get(`https://api.siputzx.my.id/api/searching/google?query=${encodeURIComponent(query)}`);
        const results = response.data?.results || response.data?.data;

        if (!results || results.length === 0) {
            // Fallback to secondary API if first one fails
            try {
                const altResponse = await axios.get(`https://api.davidcyriltech.my.id/google?query=${encodeURIComponent(query)}`);
                const altResults = altResponse.data?.results;
                if (altResults && altResults.length > 0) {
                    return sendResults(sock, chatId, msg, query, altResults);
                }
            } catch (e) { }

            return await sock.sendMessage(chatId, { text: '❌ لم يتم العثور على نتائج.' }, { quoted: msg });
        }

        await sendResults(sock, chatId, msg, query, results);

    } catch (error) {
        console.error('Google Search Error:', error);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء البحث.' }, { quoted: msg });
    }
}

async function sendResults(sock, chatId, msg, query, results) {
    let text = `🌐 *نتائج بحث جوجل لـ:* \`${query}\`\n\n`;

    results.slice(0, 5).forEach((res, i) => {
        text += `${i + 1}. *${res.title}*\n🔗 ${res.link}\n📝 ${res.snippet}\n\n`;
    });

    text += `⚔️ ${settings.botName}`;

    await sock.sendMessage(chatId, { text }, { quoted: msg });
    await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
}

module.exports = googleCommand;
