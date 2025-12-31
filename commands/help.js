const settings = require('../settings');
const { t } = require('../lib/language');
const { sendWithChannelButton } = require('../lib/channelButton');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const commandList = Array.from(commands.keys()).sort();
        const prefix = settings.prefix;

        const requested = args[0] ? args[0].toLowerCase() : null;
        const islamicAliases = ['islam', 'islamic', 'deen', 'دين', 'ديني', 'اسلاميات', 'اسلام', 'religion'];
        const gameAliases = ['games', 'game', 'العاب', 'لعب', 'منيو_لعب', 'menugame'];
        const funAliases = ['fun', 'dahik', 'ضحك', 'ترفيه', 'نكت'];
        const downloadAliases = ['download', 'tahmilat', 'tahmil', 'تحميل', 'تيليشارجي'];
        const toolsAliases = ['tools', 'adawat', 'أدوات', 'وسائل', 'خدمات'];
        const ownerAliases = ['owner', 'molchi', 'mol-chi', 'المالك', 'المطور'];
        const generalAliases = ['general', '3am', 'عام', 'نظام', 'سيستم'];
        const allAliases = ['all', 'allmenu', 'listall', 'كامل', 'كلشي'];
        const aiAliases = ['ai', 'ذكاء', 'ذكاء_اصطناعي', 'robot', 'bot'];

        // 2. Define Category Mappings
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
            'general': ['alive', 'ping', 'owner', 'script', 'setlang', 'system', 'help', 'allmenu'],
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

        // 3. Runtime Stats
        const runtime = process.uptime();
        const days = Math.floor(runtime / 86400);
        const hours = Math.floor((runtime % 86400) / 3600);
        const minutes = Math.floor((runtime % 3600) / 60);

        const header = `✨ *${t('common.botName', {}, userLang).toUpperCase()}* ✨\n` +
            `🤵‍♂️ *DEVELOPER:* ${t('common.botOwner', {}, userLang)}\n` +
            `⚡ *UPTIME:* ${days}d ${hours}h ${minutes}m\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n`;

        // --- PRIORITY 1: Sub-Menu/Category Aliases ---
        if (requested) {
            // Global Redirect for .menu all
            if (allAliases.includes(requested)) {
                const allmenu = require('./allmenu');
                return await allmenu(sock, chatId, msg, args, commands, userLang);
            }

            // Islamic Sub-Menu
            if (islamicAliases.includes(requested)) {
                let islamicMenu = `🕌 *الموسوعة الإسلامية* 🕌\n\n` +
                    `📖 .quran - تلاوة القرآن\n` +
                    `💬 .tafsir - تفسير الآيات\n` +
                    `🕋 .prayertimes - أوقات الصلاة\n` +
                    `🕌 .fadlsalat - فضل صلاة\n` +
                    `📌 .hukm - حكم شرعي\n` +
                    `🌙 .qiyam - قيام الليل\n` +
                    `🔥 .danb - ذنب مهلك\n` +
                    `💡 .nasiha - نصيحة دينية\n` +
                    `✨ .sahaba - قصة صحابي\n` +
                    ` .qisas - قصص الأنبياء والعبر\n` +
                    `📚 .hadith_long - أحاديث نبوية وقصص\n` +
                    `✨ .sahaba_long - قصص الصحابة والتابعين\n\n` +
                    `🔙 اكتب *.menu* للرجوع للقائمة.`;
                return await sendWithChannelButton(sock, chatId, islamicMenu, msg, {}, userLang);
            }

            // Games Sub-Menu
            if (gameAliases.includes(requested)) {
                let gameMenu = `🎮 *MEGA GAME MENU* 🎮\n\n` +
                    `🕹️ *ألعاب فردية:*\n` +
                    `🎲 .guess | 🤖 .rps |  .slots\n` +
                    `🧮 .math | 🧩 .riddle | 🤔 .truefalse\n\n` +
                    `🔥 *ألعاب جماعية:*\n` +
                    `❌ .xo | ❓ .quiz | ❤️ .love\n\n` +
                    ` اكتب *.menu* للرجوع للقائمة.`;
                return await sendWithChannelButton(sock, chatId, gameMenu, msg, {}, userLang);
            }

            // AI Sub-Menu
            if (aiAliases.includes(requested)) {
                let aiMenu = `🤖 *مركز الذكاء الاصطناعي (Imperial AI)* 🤖\n\n` +
                    `🤖 .gpt : سول GPT\n` +
                    `♊ .gemini : سول Gemini\n` +
                    `🧠 .deepseek : موديل ذكي جديد\n` +
                    `🖼️ .imagine : تخيل معايا (رسم)\n` +
                    `🌟 .aiart : فن واعر بالذكاء\n` +
                    `◽ .miramuse : إبداع موسيقي\n` +
                    `🎨 .ghibli-art : ستايل جيبلي\n` +
                    `◽ .faceswap : بدل الوجه ف التصويرة\n` +
                    `◽ .ai-enhance : زيين ونقي التصويرة\n` +
                    `◽ .colorize : لون التصاور القدام\n` +
                    `✨ .remini : وضح التصويرة الضبابية\n` +
                    `🎙️ .vocalremover : حيد الموسيقى وخلي الصوت\n\n` +
                    `🔙 اكتب *.menu* للرجوع للقائمة.`;
                return await sendWithChannelButton(sock, chatId, aiMenu, msg, {}, userLang);
            }
        }

        // --- PRIORITY 2: Individual Command Help ---
        if (requested && commands.has(requested)) {
            const desc = t(`command_desc.${requested}`, {}, userLang);
            if (!desc.startsWith('command_desc.')) {
                return await sendWithChannelButton(sock, chatId,
                    `💡 *${t('menu.title', {}, userLang)}:* ${prefix}${requested}\n\n` +
                    `📝 *الشرح:* ${desc}\n\n` +
                    `� *المطور:* ${t('common.botOwner', {}, userLang)}`,
                    msg, {}, userLang
                );
            }
        }

        // --- PRIORITY 3: General Category Display ---
        let menuText = "";
        let isGeneralHelp = false;

        if (!requested) {
            isGeneralHelp = true;
            menuText = header + `🔱 *مرحباً بك في إمبراطورية حمزة اعمرني* 🔱\n` +
                `تجربة فريدة كتمزج بين الذكاء، الخدمات الدينية والترفيه بلمسة احترافية.. اختار وجهتك الآن:\n\n`;

            const sectionDividers = {
                'new': '🚀 *الأقسام الأساسية*',
                'religion': '🕌 *الركن الديني (الموسوعة)*',
                'download': '📥 *قسم الوسائط والتحميل*',
                'fun': '🤣 *الترفيه والنشاط*',
                'general': '⚙️ *الإدارة والنظام*'
            };

            for (const key of Object.keys(catMap)) {
                if (sectionDividers[key]) menuText += `\n${sectionDividers[key]}\n`;
                let icon = '📂';
                let cmdAlias = key;
                if (key === 'new') icon = '🔥';
                else if (key === 'religion') { icon = '🕌'; cmdAlias = 'deen'; }
                else if (key === 'download') { icon = '📥'; cmdAlias = 'tahmilat'; }
                else if (key === 'ai') icon = '🤖';
                else if (key === 'fun') { icon = '🤣'; cmdAlias = 'dahik'; }
                else if (key === 'games') { icon = '🎮'; cmdAlias = 'game'; }
                else if (key === 'tools') { icon = '🛠️'; cmdAlias = 'adawat'; }
                else if (key === 'owner') { icon = '👑'; cmdAlias = 'molchi'; }
                else if (key === 'general') { icon = '⚙️'; cmdAlias = '3am'; }

                menuText += `${icon} *${prefix}menu ${cmdAlias}*\n`;
            }
            menuText += `\n🌟 *${prefix}menu all* - إمبراطورية الأوامر\n`;
            menuText += `\n💡 *مثال:* لإظهار أوامر الضحك، اكتب *.menu dahik*`;
        } else {
            // General Category fallback (if not caught by specific sub-menus above)
            let selectedKey = null;
            if (catMap[requested]) selectedKey = requested;
            else if (funAliases.includes(requested)) selectedKey = 'fun';
            else if (downloadAliases.includes(requested)) selectedKey = 'download';
            else if (toolsAliases.includes(requested)) selectedKey = 'tools';
            else if (ownerAliases.includes(requested)) selectedKey = 'owner';
            else if (generalAliases.includes(requested)) selectedKey = 'general';

            if (selectedKey) {
                const catName = t(`menu.categories.${selectedKey}`, {}, userLang);
                menuText = header + `*【 ${catName.toUpperCase()} 】*\n\n`;

                catMap[selectedKey].forEach(c => {
                    const icon = cmdIcons[c] || '◽';
                    const desc = t(`command_desc.${c}`, {}, userLang);
                    const descText = desc.startsWith('command_desc.') ? '' : ` : _${desc}_`;
                    menuText += `${icon} *${prefix}${c}*${descText}\n`;
                });
                menuText += `\n🔙 اكتب *.menu* للرجوع للقائمة.`;
            } else {
                menuText = `❌ قسم غير متاح. اكتب *.menu* لمشاهدة الأقسام الرئيسية.`;
            }
        }

        // --- 4. Final Delivery ---
        if (isGeneralHelp) {
            const fs = require('fs');
            let imageHandle = { url: settings.botThumbnail };
            if (!settings.botThumbnail.startsWith('http') && fs.existsSync(settings.botThumbnail)) {
                imageHandle = { image: fs.readFileSync(settings.botThumbnail) };
            } else {
                imageHandle = { image: { url: settings.botThumbnail } };
            }
            await sock.sendMessage(chatId, imageHandle, { quoted: msg });
        }

        await sendWithChannelButton(sock, chatId, menuText, msg, {}, userLang);

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: t('common.error') }, { quoted: msg });
    }
};
