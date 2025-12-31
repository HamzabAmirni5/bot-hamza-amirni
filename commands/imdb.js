const axios = require('axios');
const settings = require('../settings');

module.exports = async function imdbCommand(sock, chatId, msg, args) {
    try {
        const query = args.join(' ');
        if (!query) {
            await sock.sendMessage(chatId, { text: `🎬 الاستخدام: ${settings.prefix}imdb <اسم الفيلم>\nمثال: ${settings.prefix}imdb Iron Man` }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🎬", key: msg.key } });

        const url = `https://apis.davidcyriltech.my.id/imdb?query=${encodeURIComponent(query)}`;
        const res = await axios.get(url);

        if (!res.data.status || !res.data.movie) {
            await sock.sendMessage(chatId, { text: "❌ لم يتم العثور على نتائج للفيلم المطلوب." }, { quoted: msg });
            return;
        }

        const m = res.data.movie;

        let reply = `🎬 *${m.title}* (${m.year})\n\n`;
        reply += `⭐ التقييم: ${m.rated}\n`;
        reply += `📅 الإصدار: ${m.released}\n`;
        reply += `⏳ المدة: ${m.runtime}\n`;
        reply += `🎭 التصنيف: ${m.genres}\n`;
        reply += `🎥 المخرج: ${m.director}\n`;
        reply += `✍️ الكاتب: ${m.writer}\n`;
        reply += `🎭 الممثلون: ${m.actors}\n\n`;
        reply += `📖 القصة: ${m.plot}\n\n`;
        reply += `🌍 اللغات: ${m.languages}\n`;
        reply += `🏆 الجوائز: ${m.awards}\n\n`;
        reply += `⭐ IMDb: ${m.imdbRating}/10 (${m.votes} صوت)\n`;
        if (m.ratings && m.ratings.length > 0) {
            const rt = m.ratings.find(r => r.Source === "Rotten Tomatoes");
            if (rt) reply += `🍅 Rotten Tomatoes: ${rt.Value}\n`;
        }
        reply += `📊 Metascore: ${m.metascore}\n\n`;
        reply += `💰 البوكس أوفيس: ${m.boxoffice || "N/A"}\n\n`;
        reply += `🔗 [رابط IMDb](${m.imdbUrl})`;

        await sock.sendMessage(chatId, {
            image: { url: m.poster },
            caption: reply
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (err) {
        console.error("IMDb command error:", err.message);
        await sock.sendMessage(chatId, { text: "⚠️ حدث خطأ أثناء جلب بيانات الفيلم." }, { quoted: msg });
    }
};
