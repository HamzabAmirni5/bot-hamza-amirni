const settings = require('../settings');
const { t } = require('../lib/language');
const { sendWithChannelButton } = require('../lib/channelButton');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const commandList = Array.from(commands.keys()).sort();
        const prefix = settings.prefix;

        // 1. Handle Specific Command Help (.help kick)
        if (args[0] && !commands.has(args[0].toLowerCase())) {
            // Check if it's a category first, if not, check for command help
        } else if (args[0]) {
            const cmd = args[0].toLowerCase();
            const desc = t(`command_desc.${cmd}`, {}, userLang);
            if (!desc.startsWith('command_desc.')) {
                return await sendWithChannelButton(sock, chatId,
                    `💡 *${t('menu.title', {}, userLang)}:* ${prefix}${cmd}\n\n` +
                    `📝 *الشرح:* ${desc}\n\n` +
                    `👤 *المطور:* ${t('common.botOwner', {}, userLang)}`,
                    msg, {}, userLang
                );
            }
        }

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

        const requested = args[0] ? args[0].toLowerCase() : null;
        const islamicAliases = ['islam', 'islamic', 'deen', 'دين', 'ديني', 'اسلاميات', 'اسلام', 'religion'];
        const gameAliases = ['games', 'game', 'العاب', 'لعب', 'منيو_لعب', 'menugame'];
        const funAliases = ['fun', 'dahik', 'ضحك', 'ترفيه', 'نكت'];
        const downloadAliases = ['download', 'tahmilat', 'tahmil', 'تحميل', 'تيليشارجي'];
        const toolsAliases = ['tools', 'adawat', 'أدوات', 'وسائل', 'خدمات'];
        const ownerAliases = ['owner', 'molchi', 'mol-chi', 'المالك', 'المطور'];
        const generalAliases = ['general', '3am', 'عام', 'نظام', 'سيستم'];
        const allAliases = ['all', 'allmenu', 'listall', 'كامل', 'كلشي'];

        if (requested) {
            // --- Global Redirect for .menu all ---
            if (allAliases.includes(requested)) {
                const allmenu = require('./allmenu');
                return await allmenu(sock, chatId, msg, args, commands, userLang);
            }

            // --- Islamic Sub-Menu ---
            if (islamicAliases.includes(requested)) {
                let islamicMenu = `🕌 *الموسوعة الإسلامية* 🕌\n\n` +
                    `استخدم الأوامر التالية للحصول على معلومات دينية قيمّة:\n\n` +
                    `📖 .quran - تلاوة القرآن\n` +
                    `💬 .tafsir - تفسير الآيات\n` +
                    `🕋 .prayertimes - أوقات الصلاة\n` +
                    `🕌 .fadlsalat - فضل صلاة\n` +
                    `📌 .hukm - حكم شرعي\n` +
                    `🌙 .qiyam - قيام الليل\n` +
                    `🔥 .danb - ذنب مهلك\n` +
                    `💡 .nasiha - نصيحة دينية\n` +
                    `🧠 .tadabbur - تدبر قرآني\n` +
                    `✨ .sahaba - قصة صحابي\n` +
                    `📚 .faida - فائدة علمية\n` +
                    `⚖️ .hasanat - ميزان الحسنات\n` +
                    `📆 .jumaa - تذكير جمعة\n` +
                    `🕋 .hajj - مناسك الحج\n` +
                    `🕊️ .sira - السيرة النبوية\n` +
                    `⏳ .mawt - تذكير بالآخرة\n` +
                    `🛡️ .shirk - احذر الشرك\n` +
                    `💞 .hub - حب الله\n` +
                    `🌴 .jannah - وصف الجنة\n` +
                    `🔥 .nar - وصف النار\n` +
                    `⚰️ .qabr - عذاب ونعيم القبر\n` +
                    `🌋 .qiyama - أهوال القيامة\n` +
                    `🌟 .mo3jiza - معجزات نبوية\n` +
                    `📜 .tabiin - من قصص التابعين\n` +
                    `🧕 .omahat - أمهات المؤمنين\n` +
                    `👼 .malaika - عالم الملائكة\n` +
                    `📖 .qisas - قصص الأنبياء والعبر\n` +
                    `📚 .hadith_long - أحاديث نبوية وقصص\n` +
                    `✨ .sahaba_long - قصص الصحابة والتابعين\n` +
                    `🧠 .deenquiz - مسابقة المعلومات الدينية\n\n` +
                    `©️ *${t('common.botName', {}, userLang)} | 2025*`;

                return await sendWithChannelButton(sock, chatId, islamicMenu, msg, {}, userLang);
            }

            // --- Games Sub-Menu ---
            if (gameAliases.includes(requested)) {
                let gameMenu = `🎮 *MEGA GAME MENU* 🎮\n\n` +
                    `🕹️ *ألعاب فردية (Solo):*\n` +
                    `🎲 .guess - خمن الرقم\n` +
                    `🤖 .rps - حجرة ورقة مقص\n` +
                    `🕵️ .guesswho - شكون أنا؟\n` +
                    `🃏 .blackjack - بلاك جاك (21)\n` +
                    `🎰 .slots - ماكينة القمار\n` +
                    `🧮 .math - تحدي الحساب\n` +
                    `🧩 .scramble - رتب الكلمة\n` +
                    `🧩 .riddle - حاجيتك ماجيتك\n` +
                    `🤔 .truefalse - صح أم خطأ\n` +
                    `🎭 .emojigame - خمن الإيموجي\n\n` +
                    `🔥 *ألعاب جماعية (PvP):*\n` +
                    `❌ .tictactoe - لعبة XO\n` +
                    `❓ .quiz - مسابقة ثقافية\n` +
                    `❤️ .love - مقياس الحب\n` +
                    `📊 .rate - التقييم المضحك\n` +
                    `🛳️ .ship - زوج جوج (Match)\n\n` +
                    `🏆 *الاقتصاد والتنافس:*\n` +
                    `👤 .profile - البروفايل الخاص\n` +
                    `💰 .daily - الرصيد اليومي\n` +
                    `🛍️ .shop - المتجر\n` +
                    `🥇 .top - ترتيب الأوائل\n\n` +
                    `🔙 اكتب *.menu* للرجوع للقائمة.`;

                return await sendWithChannelButton(sock, chatId, gameMenu, msg, {}, userLang);
            }

            // --- AI Sub-Menu ---
            const aiAliases = ['ai', 'ذكاء', 'ذكاء_اصطناعي', 'robot', 'bot'];
            if (aiAliases.includes(requested)) {
                let aiMenu = `🤖 *مركز الذكاء الاصطناعي (Imperial AI)* 🤖\n\n` +
                    `✨ *النماذج الذكية (LLMs):*\n` +
                    `🤖 .gpt - هضر مع الساط GPT\n` +
                    `♊ .gemini - جوجل Gemini\n` +
                    `🧠 .deepseek - موديل DeepSeek الجديد\n\n` +
                    `🎨 *توليد ومعالجة الصور:*\n` +
                    `🖼️ .imagine - رسم بالذكاء الاصطناعي\n` +
                    `🌟 .aiart - فن واعر بالذكاء\n` +
                    `✨ .remini - وضح ونقي التصويرة\n` +
                    `🖌️ .colorize - لون التصاور القدام\n` +
                    `🎭 .faceswap - بدل الوجه ف التصويرة\n` +
                    `🪄 .edit - ميكساج وتعديل الصور\n\n` +
                    `🎧 *معالجة الصوت:*\n` +
                    `🎙️ .vocalremover - حيد الموسيقى وخلي الصوت\n\n` +
                    `🔙 اكتب *.menu* للرجوع للقائمة.`;

                return await sendWithChannelButton(sock, chatId, aiMenu, msg, {}, userLang);
            }
        }

        let menuText = "";
        let isGeneralHelp = false;

        // --- Selective Rendering ---
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
                const catName = t(`menu.categories.${key}`, {}, userLang);

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
            let selectedKey = null;
            if (islamicAliases.includes(requested)) selectedKey = 'religion';
            else if (gameAliases.includes(requested)) selectedKey = 'games';
            else if (funAliases.includes(requested)) selectedKey = 'fun';
            else if (downloadAliases.includes(requested)) selectedKey = 'download';
            else if (toolsAliases.includes(requested)) selectedKey = 'tools';
            else if (ownerAliases.includes(requested)) selectedKey = 'owner';
            else if (generalAliases.includes(requested)) selectedKey = 'general';
            else if (catMap[requested]) selectedKey = requested;

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

        // 4. Send Visual Header (Photo) + Imperial Text
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
