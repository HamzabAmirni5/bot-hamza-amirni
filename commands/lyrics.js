const axios = require('axios');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');

// Utility: split long lyrics into safe chunks for WhatsApp
function chunkText(text, size = 3000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

async function lyricsCommand(sock, chatId, msg, args) {
    const songTitle = args.join(' ').trim();

    if (!songTitle) {
        const helpMsg = `🎵 *البحث عن كلمات الأغاني* 🎵

🔹 *الاستخدام:*
${settings.prefix}lyrics [اسم الأغنية]
${settings.prefix}kalimat [اسم الأغنية]

📝 *أمثلة:*
• ${settings.prefix}lyrics سعد المجرد
• ${settings.prefix}kalimat اغنية مغربية
• ${settings.prefix}lyrics Perfect Ed Sheeran

⚔️ ${settings.botName}`;

        return await sendWithChannelButton(sock, chatId, helpMsg, msg);
    }

    try {
        await sendWithChannelButton(sock, chatId, `⏳ جاري البحث عن كلمات أغنية "${songTitle}"...`, msg);

        const apiUrl = `https://apis.davidcyriltech.my.id/lyrics3?song=${encodeURIComponent(songTitle)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const json = response.data;

        if (!json.success || !json.result || !json.result.lyrics) {
            return await sendWithChannelButton(sock, chatId, `❌ عذراً، لم أتمكن من العثور على كلمات الأغنية لـ "${songTitle}".`, msg);
        }

        const { song, artist, lyrics } = json.result;

        const header = `🎶 *كلمات الأغنية* 🎶\n\n` +
            `📌 *العنوان:* ${song || songTitle}\n` +
            `👤 *الفنان:* ${artist || 'غير معروف'}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        await sock.sendMessage(chatId, { text: header }, { quoted: msg });

        const parts = chunkText(lyrics);
        for (const part of parts) {
            await sock.sendMessage(chatId, { text: part });
        }

        await sock.sendMessage(chatId, { text: `\n⚔️ ${settings.botName}` });

    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sendWithChannelButton(sock, chatId, `❌ عفواً، حدث خطأ أثناء جلب كلمات الأغنية. حاول لاحقاً.`, msg);
    }
}

module.exports = lyricsCommand;
