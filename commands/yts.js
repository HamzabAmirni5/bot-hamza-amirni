const yts = require('yt-search');
const { t } = require('../lib/language');
const settings = require('../settings');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    const text = args.join(' ');

    if (!text) {
        await sock.sendMessage(chatId, {
            text: t('yts.usage', { prefix: settings.prefix, botName: t('common.botName', {}, userLang) }, userLang)
        }, { quoted: msg });
        return;
    }

    // Reaction or waiting message
    await sock.sendMessage(chatId, {
        text: t('common.wait', {}, userLang)
    }, { quoted: msg });

    try {
        let results = await yts(text);
        let tes = results.all;

        if (!tes || tes.length === 0) {
            await sock.sendMessage(chatId, { text: t('yts.no_result', {}, userLang) }, { quoted: msg });
            return;
        }

        let teks = results.all.map(v => {
            switch (v.type) {
                case 'video': return `
° *_${v.title}_*
↳ 🫐 *_Link:_* ${v.url}
↳ 🕒 *_Duration:_* ${v.timestamp}
↳ 📥 *_Ago:_* ${v.ago}
↳ 👁 *_Views:_* ${v.views}
`.trim();
            }
        }).filter(v => v).join('\n\n◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦\n\n');

        teks += `\n\n⚔️ *${t('common.botName', {}, userLang)}*`;

        await sock.sendMessage(chatId, {
            image: { url: tes[0].thumbnail },
            caption: teks
        }, { quoted: msg });

    } catch (e) {
        console.error('Error in yts:', e);
        await sock.sendMessage(chatId, { text: t('common.error', {}, userLang) }, { quoted: msg });
    }
};
