const settings = require('../settings');
const { t } = require('../lib/language');
const { sendWithChannelButton } = require('../lib/channelButton');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const prefix = settings.prefix;

        // Runtime Stats
        const runtime = process.uptime();
        const days = Math.floor(runtime / 86400);
        const hours = Math.floor((runtime % 86400) / 3600);
        const minutes = Math.floor((runtime % 3600) / 60);

        const header = `🌟 *${t('common.botName', {}, userLang).toUpperCase()} - TOTAL MISSION* 🌟\n` +
            `🤵‍♂️ *DEVELOPER:* ${t('common.botOwner', {}, userLang)}\n` +
            `⚡ *UPTIME:* ${days}d ${hours}h ${minutes}m\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `✨ *أهلاً بك في فضاء حمزة اعمرني* 🪐✨\n` +
            `هادي هي الخريطة الشاملة لمملكة البوت، كل ماتحتاجو باش تسيطر على لكروب مجموع هنا في بلاصة وحدة! ⚔️💎\n\n`;

        const catMap = {
            'new': ['edit', 'genai', 'banana-ai', 'ghibli', 'tomp3', 'resetlink', 'apk', 'apk2', 'hidetag', 'imdb', 'simp'],
            'religion': ['quran', 'salat', 'prayertimes', 'adhan', 'hadith', 'asmaa', 'azkar', 'qibla', 'ad3iya', 'dua', 'athan', 'tafsir', 'surah', 'ayah', 'fadlsalat', 'hukm', 'qiyam', 'danb', 'nasiha', 'tadabbur', 'sahaba', 'faida', 'hasanat', 'jumaa', 'hajj', 'sira', 'mawt', 'shirk', 'hub', 'deen'],
            'download': ['facebook', 'instagram', 'tiktok', 'youtube', 'mediafire', 'github', 'play', 'song', 'video', 'ytplay', 'yts'],
            'ai': ['gpt', 'gemini', 'deepseek', 'imagine', 'aiart', 'miramuse', 'ghibli-art', 'faceswap', 'ai-enhance', 'colorize', 'remini', 'vocalremover'],
            'group': ['kick', 'promote', 'demote', 'tagall', 'hidetag', 'mute', 'unmute', 'close', 'open', 'delete', 'staff', 'groupinfo', 'welcome', 'goodbye', 'warn', 'warnings', 'antibadword', 'antilink'],
            'tools': ['sticker', 'sticker-alt', 'attp', 'ttp', 'ocr', 'tts', 'say', 'toimage', 'tovideo', 'togif', 'qrcode', 'ss', 'lyrics', 'calc', 'img-blur', 'translate'],
            'news': ['news', 'akhbar', 'football', 'kora', 'weather', 'taqes'],
            'fun': ['joke', 'fact', 'quote', 'meme', 'character', 'truth', 'dare', 'ship', 'ngl', '4kwallpaper'],
            'games': ['menugame', 'xo', 'rps', 'math', 'guess', 'scramble', 'riddle', 'quiz', 'love', 'hangman', 'trivia'],
            'economy': ['profile', 'daily', 'top', 'shop', 'gamble', 'slots'],
            'general': ['alive', 'ping', 'owner', 'script', 'setlang', 'system', 'help'],
            'owner': ['mode', 'devmsg', 'autoreminder', 'pmblocker', 'backup', 'ban', 'unban', 'block', 'unblock', 'cleartmp', 'sudo', 'clear', 'clearsession', 'anticall']
        };

        const cmdIcons = {
            'genai': '🎨', 'edit': '🪄', 'banana-ai': '🍌', 'ghibli': '🎭', 'tomp3': '🎵', 'apk': '📱', 'apk2': '🚀', 'simp': '💘',
            'quran': '📖', 'salat': '🕌', 'prayertimes': '🕋', 'adhan': '📢', 'hadith': '📚', 'asmaa': '✨', 'azkar': '📿', 'qibla': '🧭', 'ad3iya': '🤲', 'deen': '🕌',
            'jumaa': '📆', 'hajj': '🕋', 'sira': '🕊️', 'mawt': '⏳', 'shirk': '🛡️', 'hub': '💞', 'jannah': '🌴', 'nar': '🔥', 'qabr': '⚰️', 'qiyama': '🌋',
            'facebook': '🔵', 'instagram': '📸', 'tiktok': '🎵', 'youtube': '🎬', 'mediafire': '📂', 'play': '🎧', 'song': '🎶', 'video': '🎥',
            'gpt': '🤖', 'gemini': '♊', 'deepseek': '🧠', 'imagine': '🖼️', 'aiart': '🌟', 'ghibli-art': '🎨', 'remini': '✨',
            'kick': '🚫', 'promote': '🆙', 'demote': '⬇️', 'tagall': '📢', 'hidetag': '👻', 'mute': '🔇', 'unmute': '🔊', 'close': '🔒', 'open': '🔓',
            'sticker': '🖼️', 'translate': '🗣️', 'ocr': '🔍', 'qrcode': '🏁', 'weather': '🌦️', 'lyrics': '📜', 'calc': '🔢',
            'game': '🎮', 'quiz': '🧠', 'riddle': '🧩', 'joke': '🤣', 'meme': '🐸', 'truth': '💡', 'dare': '🔥',
            'profile': '👤', 'daily': '💰', 'top': '🏆', 'shop': '🛒',
            'alive': '🟢', 'ping': '⚡', 'owner': '👑', 'help': '❓'
        };

        let menuText = header;

        const sectionTitles = {
            'new': '🚀 *الأقسام الأساسية*',
            'religion': '🕌 *الركن الديني*',
            'download': '📥 *قسم الوسائط والتحميل*',
            'ai': '🤖 *الذكاء الاصطناعي*',
            'group': '⚙️ *إدارة المجموعات*',
            'tools': '🛠️ *الأدوات والخدمات*',
            'news': '📰 *الأخبار والرياضة*',
            'fun': '🤣 *الترفيه والضحك*',
            'games': '🎮 *الألعاب والمسابقات*',
            'economy': '💰 *الاقتصاد والتنافس*',
            'general': '🛡️ *النظام والعامة*',
            'owner': '👑 *قسم المطور (Owner)*'
        };

        for (const [key, cmds] of Object.entries(catMap)) {
            const title = sectionTitles[key] || t(`menu.categories.${key}`, {}, userLang);
            menuText += `\n${title}\n`;

            cmds.forEach(c => {
                const icon = cmdIcons[c] || '◽';
                const desc = t(`command_desc.${c}`, {}, userLang);
                const descText = desc.startsWith('command_desc.') ? '' : ` : _${desc}_`;
                menuText += `${icon} *${prefix}${c}*${descText}\n`;
            });
            menuText += `━━━━━━━━━━━━━━━━━━━\n`;
        }

        // 4. Send Visual Header (Photo) + Full Empire List
        const fs = require('fs');
        let imageHandle = { url: settings.botThumbnail };
        if (!settings.botThumbnail.startsWith('http') && fs.existsSync(settings.botThumbnail)) {
            imageHandle = { image: fs.readFileSync(settings.botThumbnail) };
        } else {
            imageHandle = { image: { url: settings.botThumbnail } };
        }
        await sock.sendMessage(chatId, imageHandle, { quoted: msg });

        await sendWithChannelButton(sock, chatId, menuText, msg, {}, userLang);

    } catch (error) {
        console.error('Error in allmenu command:', error);
        await sock.sendMessage(chatId, { text: t('common.error') }, { quoted: msg });
    }
};
