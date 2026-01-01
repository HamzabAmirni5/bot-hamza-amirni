const settings = require('../settings');
const { t } = require('../lib/language');
const { sendWithChannelButton } = require('../lib/channelButton');
const fs = require('fs');
const path = require('path');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const prefix = settings.prefix;

        // Runtime Stats
        const runtime = process.uptime();
        const days = Math.floor(runtime / 86400);
        const hours = Math.floor((runtime % 86400) / 3600);
        const minutes = Math.floor((runtime % 3600) / 60);

        let thumbBuffer = null;
        try {
            let thumbPath = settings.botThumbnail;
            if (!path.isAbsolute(thumbPath)) {
                thumbPath = path.join(__dirname, '..', thumbPath);
            }
            if (fs.existsSync(thumbPath)) {
                thumbBuffer = fs.readFileSync(thumbPath);
            }
        } catch (e) { console.error('Error reading thumbnail:', e); }

        const date = new Date();
        const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateString = date.toLocaleDateString('en-GB');

        const header =
            `┏━━━ ❰ *${t('common.botName', {}, userLang).toUpperCase()}* ❱ ━━━┓\n` +
            `┃ 🤵‍♂️ *Owner:* ${t('common.botOwner', {}, userLang)}\n` +
            `┃ 📅 *Date:* ${dateString}\n` +
            `┃ ⌚ *Time:* ${timeString}\n` +
            `┃ ⏳ *Uptime:* ${days}d ${hours}h ${minutes}m\n` +
            `┃ 🤖 *Ver:* ${settings.version || '2.0.0'}\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n`;

        const catMap = {
            'new': ['brat-vd', 'hdvideo', 'winkvideo', 'musicgen', 'removebg', 'unblur', 'upload', 'readviewonce', 'edit', 'genai', 'banana-ai', 'ghibli', 'tomp3', 'apk', 'hidetag', 'imdb'],
            'religion': ['quran', 'salat', 'prayertimes', 'adhan', 'hadith', 'asmaa', 'azkar', 'qibla', 'ad3iya', 'dua', 'tafsir', 'surah', 'ayah', 'fadlsalat', 'hukm', 'qiyam', 'danb', 'nasiha', 'tadabbur', 'sahaba', 'faida', 'hasanat', 'jumaa', 'hajj', 'sira', 'mawt', 'shirk', 'hub', 'deen'],
            'download': ['facebook', 'instagram', 'tiktok', 'youtube', 'mediafire', 'github', 'play', 'song', 'video', 'ytplay', 'yts'],
            'ai': ['musicgen', 'gpt', 'gemini', 'deepseek', 'imagine', 'aiart', 'miramuse', 'ghibli-art', 'faceswap', 'ai-enhance', 'colorize', 'remini', 'unblur', 'vocalremover'],
            'group': ['kick', 'promote', 'demote', 'tagall', 'hidetag', 'mute', 'unmute', 'close', 'open', 'delete', 'staff', 'groupinfo', 'welcome', 'goodbye', 'warn', 'warnings', 'antibadword', 'antilink'],
            'tools': ['removebg', 'upload', 'readviewonce', 'sticker', 'sticker-alt', 'attp', 'ttp', 'ocr', 'tts', 'say', 'toimage', 'tovideo', 'togif', 'qrcode', 'ss', 'lyrics', 'calc', 'img-blur', 'translate'],
            'news': ['news', 'akhbar', 'football', 'kora', 'weather', 'taqes'],
            'fun': ['joke', 'fact', 'quote', 'meme', 'character', 'truth', 'dare', 'ship', 'ngl', '4kwallpaper'],
            'games': ['menugame', 'xo', 'rps', 'math', 'guess', 'scramble', 'riddle', 'quiz', 'love', 'hangman', 'trivia'],
            'economy': ['profile', 'daily', 'top', 'shop', 'gamble', 'slots'],
            'general': ['alive', 'ping', 'owner', 'script', 'setlang', 'system', 'help'],
            'owner': ['mode', 'devmsg', 'autoreminder', 'pmblocker', 'backup', 'ban', 'unban', 'block', 'unblock', 'cleartmp', 'sudo', 'clear', 'clearsession', 'anticall']
        };

        const cmdIcons = {
            'brat-vd': '🎬', 'hdvideo': '📀', 'winkvideo': '📹', 'musicgen': '🎵', 'removebg': '🖼️', 'unblur': '✨', 'upload': '📤', 'readviewonce': '👁️',
            'genai': '🎨', 'edit': '🪄', 'banana-ai': '🍌', 'ghibli': '🎭', 'tomp3': '🎵', 'apk': '📱', 'apk2': '🚀', 'simp': '💘',
            'quran': '📖', 'salat': '🕌', 'prayertimes': '🕋', 'adhan': '📢', 'hadith': '📚', 'asmaa': '✨', 'azkar': '📿', 'qibla': '🧭', 'ad3iya': '🤲', 'deen': '🕌',
            'jumaa': '📆', 'hajj': '🕋', 'sira': '🕊️', 'mawt': '⏳', 'shirk': '🛡️', 'hub': '💞', 'jannah': '🌴', 'nar': '🔥', 'qabr': '⚰️', 'qiyama': '🌋',
            'facebook': '🔵', 'instagram': '📸', 'tiktok': '🎵', 'youtube': '🎬', 'mediafire': '📂', 'play': '🎧', 'song': '🎶', 'video': '🎥',
            'gpt': '🤖', 'gemini': '♊', 'deepseek': '🧠', 'imagine': '🖼️', 'aiart': '🌟', 'ghibli-art': '🎨', 'remini': '✨',
            'kick': '👠', 'promote': '👑', 'demote': '⬇️', 'tagall': '📢', 'hidetag': '👻', 'mute': '🔇', 'unmute': '🔊', 'close': '🔒', 'open': '🔓',
            'sticker': '🖼️', 'translate': '🗣️', 'ocr': '🔍', 'qrcode': '🏁', 'weather': '🌦️', 'lyrics': '📜', 'calc': '🔢',
            'game': '🎮', 'quiz': '🧠', 'riddle': '🧩', 'joke': '🤣', 'meme': '🐸', 'truth': '💡', 'dare': '🔥',
            'profile': '👤', 'daily': '💰', 'top': '🏆', 'shop': '🛒',
            'alive': '🟢', 'ping': '⚡', 'owner': '👑', 'help': '❓'
        };

        let menuText = header;

        const sectionTitles = {
            'new': '🔥 *Hot & New*',
            'religion': '🕌 *Islamic Corner*',
            'download': '📥 *Downloads*',
            'ai': '🤖 *AI Zone*',
            'group': '⚙️ *Group Mgmt*',
            'tools': '🛠️ *Tools*',
            'news': '📰 *News & Sport*',
            'fun': '🤣 *Fun*',
            'games': '🎮 *Games*',
            'economy': '💰 *Economy*',
            'general': '🛡️ *General*',
            'owner': '👑 *Owner*'
        };

        for (const [key, cmds] of Object.entries(catMap)) {
            const title = sectionTitles[key] || t(`menu.categories.${key}`, {}, userLang);
            menuText += `\n┌─── ❰ ${title} ❱ ───┐\n`;

            cmds.forEach(c => {
                const icon = cmdIcons[c] || '🔹';
                const desc = t(`command_desc.${c}`, {}, userLang);
                const descText = desc.startsWith('command_desc.') ? '' : ` : ${desc}`;
                menuText += `│ ${icon} *${prefix}${c}*${descText}\n`;
            });
            menuText += `└──────────────────┘\n`;
        }

        menuText += `\n🏰 *Empire of Commands* 🏰`;

        const adReply = {
            title: `${t('common.botName', {}, userLang)} Menu`,
            body: "انضم إلى قناتنا الرسمية للتحديثات",
            sourceUrl: settings.officialChannel || 'https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p',
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true
        };

        if (thumbBuffer) {
            adReply.thumbnail = thumbBuffer;
        } else if (settings.botThumbnail && settings.botThumbnail.startsWith('http')) {
            adReply.thumbnailUrl = settings.botThumbnail;
        }

        // Add channel link to the bottom
        const fullText = menuText + `\n\n📢 *القناة الرسمية:*\n${settings.officialChannel}`;

        if (thumbBuffer) {
            // Send as image with caption
            await sock.sendMessage(chatId, {
                image: thumbBuffer,
                caption: fullText
            }, { quoted: msg });
        } else {
            // Fallback to text only
            await sock.sendMessage(chatId, {
                text: fullText
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error in allmenu command:', error);
        await sock.sendMessage(chatId, { text: t('common.error') }, { quoted: msg });
    }
};
