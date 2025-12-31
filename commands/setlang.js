const { t } = require('../lib/language');
const settings = require('../settings');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        if (!args[0]) {
            return await sock.sendMessage(chatId, {
                text: t('setlang.help', {}, userLang)
            }, { quoted: msg });
        }

        const input = args[0].toLowerCase();
        let newLang = null;
        let confirmMsg = '';

        if (input === '1' || input === 'en' || input === 'english') {
            newLang = 'en';
            confirmMsg = '✅ *Language set to English!*';
        } else if (input === '2' || input === 'ar' || input === 'arabic' || input === 'العربية' || input === 'عربية') {
            newLang = 'ar';
            confirmMsg = '✅ *تم تعيين اللغة العربية!*';
        } else if (input === '3' || input === 'ma' || input === 'darija' || input === 'moroccan' || input === 'الدارجة' || input === 'دارجة') {
            newLang = 'ma';
            confirmMsg = '✅ *صافي تكونيكطينا!* دابا غانهضر معاك بالدارجة القاصحة أ عشيري. 🇲🇦';
        } else {
            return await sock.sendMessage(chatId, {
                text: t('setlang.unsupported', {}, userLang)
            }, { quoted: msg });
        }

        // Save Language
        const { setUserLanguage } = require('../lib/userLogger');
        const senderId = msg.key.participant || msg.key.remoteJid;
        setUserLanguage(senderId, newLang);

        await sock.sendMessage(chatId, { text: confirmMsg }, { quoted: msg });

    } catch (error) {
        console.error("Error in setlang:", error);
    }
};
