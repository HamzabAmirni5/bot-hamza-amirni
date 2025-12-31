const { t } = require('./language');
const settings = require('../settings');

/**
 * Sends a message with high reliability.
 * Simple footer-style branding to ensure messages ARE ALWAYS VISIBLE.
 */
async function sendWithChannelButton(sock, chatId, text, quoted = null, content = {}, userLang = null) {
    try {
        const botName = t('common.botName', {}, userLang);
        const channelLabel = t('common.channel', {}, userLang);
        const footerText = `\n\n📢 *${channelLabel}:* ${settings.officialChannel}\n⚔️ *${botName}*`;

        return await sock.sendMessage(chatId, {
            text: text + footerText,
            contextInfo: {
                mentionedJid: [chatId],
                ...(content.contextInfo || {})
            },
            ...content
        }, { quoted });
    } catch (error) {
        console.error('Error in sendWithChannelButton:', error);
        return await sock.sendMessage(chatId, { text: text }, { quoted });
    }
}

module.exports = { sendWithChannelButton };
