const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { t } = require('../lib/language');
const settings = require('../settings');

async function videoCommand(sock, chatId, msg, args, commands, userLang) {
    try {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        const searchQuery = text?.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            const usageMsg = userLang === 'ma'
                ? "⚠️ *كتب ليا سمية الفيديو ولا الليان.*\n📝 مثال: .video طوطو"
                : userLang === 'ar'
                    ? "⚠️ *يرجى كتابة اسم الفيديو أو الرابط.*\n📝 مثال: .video سورة البقرة"
                    : "⚠️ *Please provide a video name or URL.*\n📝 Example: .video funny cats";
            await sock.sendMessage(chatId, { text: usageMsg }, { quoted: msg });
            return;
        }

        // Determine if input is a YouTube link
        let videoUrl = '';
        let previewTitle = '';
        let previewThumbnail = '';

        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: t('download.yt_no_result', {}, userLang) }, { quoted: msg });
                return;
            }
            videoUrl = videos[0].url;
            previewTitle = videos[0].title;
            previewThumbnail = videos[0].thumbnail;
        }

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { text: t('download.yt_invalid_url', {}, userLang) }, { quoted: msg });
            return;
        }

        // React with ⏳ and send status when starting download
        const dlMsg = userLang === 'ma'
            ? "⏳ *بلاتي، هانا كنتيليشارجي... صبر عشيري*"
            : userLang === 'ar'
                ? "⏳ *يتم تحميل الفيديو، يرجى الانتظار...*"
                : "⏳ *Downloading, please wait...*";
        await sock.sendMessage(chatId, { text: dlMsg }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        // Use new API (Hamza Amirni's)
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' } });

        if (response.status !== 200 || !response.data.status) {
            await sock.sendMessage(chatId, { text: t('download.yt_error', {}, userLang) }, { quoted: msg });
            return;
        }

        const data = response.data;
        const title = data.title || previewTitle || 'video.mp4';
        const thumbnail = data.thumbnail || previewThumbnail;
        const quality = "360p";
        const videoDownloadUrl = data.videos["360"]; // use 360 quality link
        const filename = `${title.replace(/[^a-zA-Z0-9-_\.]/g, '_')}.mp4`;

        // Send preview before downloading
        const prevMsg = userLang === 'ma'
            ? `🎬 *لقيتها!* دابا غانصيفطها ليك...\n📌 *العنوان:* ${title}`
            : `🎬 *Found it!* Sending now...\n📌 *Title:* ${title}`;

        await sock.sendMessage(chatId, {
            image: { url: thumbnail },
            caption: prevMsg
        }, { quoted: msg });

        // Try sending the video directly from the remote URL
        try {
            const successCap = userLang === 'ma'
                ? `✅ *تفضل أ عشيري!* \n\n🎬 *${title}*\n⚔️ ${settings.botName}`
                : `✅ *Here is your video!* \n\n🎬 *${title}*\n⚔️ ${settings.botName}`;
            await sock.sendMessage(chatId, {
                video: { url: videoDownloadUrl },
                mimetype: 'video/mp4',
                fileName: filename,
                caption: successCap
            }, { quoted: msg });

            // React with ✅ when finished
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            return;
        } catch (directSendErr) {
            console.log('[video.js] Direct send from URL failed:', directSendErr.message);
        }

        // If direct send fails, fallback to downloading
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        // Clean up old files in temp first to free space
        try {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > 10 * 60 * 1000) { // Delete files older than 10 mins
                    fs.unlinkSync(filePath);
                }
            }
        } catch (e) { }

        const tempFile = path.join(tempDir, `${Date.now()}.mp4`);

        try {
            // Check content-length header first
            const headRes = await axios.head(videoDownloadUrl);
            const contentLength = headRes.headers['content-length'];
            if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) { // 100MB limit
                await sock.sendMessage(chatId, { text: t('download.yt_large', {}, userLang) }, { quoted: msg });
                return;
            }

            // Stream download
            const writer = fs.createWriteStream(tempFile);
            const videoRes = await axios({
                url: videoDownloadUrl,
                method: 'GET',
                responseType: 'stream'
            });

            videoRes.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const stats = fs.statSync(tempFile);
            const maxSize = 100 * 1024 * 1024; // 100MB limit hard check
            if (stats.size > maxSize) {
                fs.unlinkSync(tempFile); // Delete immediately if too big
                await sock.sendMessage(chatId, { text: t('download.yt_large', {}, userLang) }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                video: { url: tempFile },
                mimetype: 'video/mp4',
                fileName: filename,
                caption: t('download.yt_success', {
                    title: title,
                    quality: quality,
                    botName: settings.botName
                }, userLang)
            }, { quoted: msg });

            // React with ✅ when finished
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

        } catch (err) {
            console.log('📹 Download or send failed:', err.message);
            await sock.sendMessage(chatId, { text: t('download.yt_error', {}, userLang) + `: ${err.message}` }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        } finally {
            // Cleanup temp file
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                } catch { }
            }, 5000);
        }

    } catch (error) {
        console.log('📹 Video Command Error:', error.message, error.stack);
        await sock.sendMessage(chatId, { text: t('download.yt_error', {}, userLang) + `: ${error.message}` }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    }

}

module.exports = videoCommand;

