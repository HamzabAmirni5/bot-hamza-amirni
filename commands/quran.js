const { sendWithChannelButton } = require('../lib/channelButton');
const axios = require('axios');
const { t } = require('../lib/language');
const settings = require('../settings');

const { getSurahNumber } = require('../lib/quranUtils');
const { setSession } = require('../lib/quranSession');

async function quranCommand(sock, chatId, message, args, commands, userLang) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const inputArgs = text.split(' ').slice(1).join(' ').trim();

        if (!inputArgs) {
            await sendWithChannelButton(sock, chatId, t('quran.enter_number', {}, userLang), message);
            return;
        }

        const surahNumber = getSurahNumber(inputArgs);

        if (!surahNumber) {
            await sendWithChannelButton(sock, chatId, t('quran.not_found', {}, userLang), message);
            return;
        }

        if (surahNumber < 1 || surahNumber > 114) {
            await sendWithChannelButton(sock, chatId, t('quran.invalid_number', {}, userLang), message);
            return;
        }

        const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}`;
        const response = await axios.get(apiUrl);
        if (!response.data || response.data.status !== 'OK') {
            await sendWithChannelButton(sock, chatId, t('quran.fetch_error', {}, userLang), message);
            return;
        }

        const surah = response.data.data;
        const name = surah.name;
        const englishName = surah.englishName;
        const ayahs = surah.ayahs || [];

        let textParts = [];
        textParts.push(t('quran.surah_info', { name, englishName, length: ayahs.length }, userLang));
        textParts.push('━━━━━━━━━━━━━━━━━━━━');

        const ayahsPerPage = 30;
        const maxAyahs = Math.min(ayahs.length, ayahsPerPage);

        for (let i = 0; i < maxAyahs; i++) {
            const a = ayahs[i];
            textParts.push(`${a.numberInSurah}. ${a.text}`);
        }

        if (ayahs.length > maxAyahs) {
            textParts.push('\n━━━━━━━━━━━━━━━━━━━━');
            textParts.push(t('quran.hidden_ayahs', {}, userLang));
            textParts.push(t('quran.continue_tip', { prefix: settings.prefix }, userLang));

            // Save session for .continue
            setSession(chatId, {
                surahNumber,
                name,
                englishName,
                lastIndex: maxAyahs,
                totalAyahs: ayahs.length
            });
        }

        textParts.push('\n━━━━━━━━━━━━━━━━━━━━');
        textParts.push(t('quran.sending_audio', {}, userLang));

        const caption = textParts.join('\n');

        await sendWithChannelButton(sock, chatId, caption, message);

        const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: message });
    } catch (error) {
        console.error('Error in quran command:', error);
        await sendWithChannelButton(sock, chatId, t('quran.error', {}, userLang), message);
    }
}

module.exports = quranCommand;
