const axios = require("axios");
const yts = require("yt-search");

async function ytplayCommand(sock, chatId, msg, args) {
    const query = args.join(' ');
    if (!query) {
        return await sock.sendMessage(chatId, {
            text: "⚠️ يرجى إدخال رابط يوتيوب أو اسم الأغنية.\n\nمثال:\n```.ytplay another love```"
        }, { quoted: msg });
    }

    try {
        let videoUrl = query;

        // Step 1: React while searching and send status
        await sock.sendMessage(chatId, { text: '⏳ *جاري البحث والتحميل، يرجى الانتظار...*' }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const search = await yts(query);
            if (!search.videos || search.videos.length === 0) {
                return await sock.sendMessage(chatId, { text: `❌ لم يتم العثور على نتائج لـ: ${query}` }, { quoted: msg });
            }
            videoUrl = search.videos[0].url;
        }

        // Step 2: React while fetching link
        await sock.sendMessage(chatId, { react: { text: "📥", key: msg.key } });

        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 60000 });
        const data = response.data?.result;

        if (!data || !data.download_url) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
            return await sock.sendMessage(chatId, { text: "❌ فشل جلب الصوت. حاول مرة أخرى." }, { quoted: msg });
        }

        // Step 3: React while sending audio
        await sock.sendMessage(chatId, { react: { text: "🎶", key: msg.key } });

        await sock.sendMessage(chatId, {
            audio: { url: data.download_url },
            mimetype: "audio/mpeg",
            ptt: false,
            fileName: `${data.title || "yt-audio"}.mp3`
        }, { quoted: msg });

        // Final ✅ reaction
        await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("YTPlay Error:", error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
        await sock.sendMessage(chatId, { text: "❌ حدث خطأ أثناء معالجة طلبك." }, { quoted: msg });
    }
}

module.exports = ytplayCommand;
