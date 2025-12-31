const axios = require('axios');
const cheerio = require('cheerio');
const settings = require('../settings');

class Wallpaper {
    constructor() {
        this.base = 'https://4kwallpapers.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        };
    }

    async search(q) {
        if (!q) return 'Missing query.';
        try {
            let { data } = await axios.get(`${this.base}/search/?text=${encodeURIComponent(q)}`, {
                headers: this.headers
            });
            const $ = cheerio.load(data);
            let res = [];
            $('div#pics-list .wallpapers__item').each((i, e) => {
                res.push({
                    thumbnail: $(e).find('img').attr('src'),
                    title: $(e).find('.title2').text().trim(),
                    url: $(e).find('a').attr('href')
                });
            });
            return res;
        } catch (e) {
            return e.message;
        }
    }

    async download(url) {
        if (!url) return 'Missing wallpaper URL.';
        try {
            let { data } = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(data);
            const main = $('#main-pic');
            const list = $('#res-list');
            let res = {
                title: $('.main-id .selected').text().trim(),
                thumbnail: $(main).find('img').attr('src'),
                image: {
                    desktop: [],
                    mobile: [],
                    tablet: []
                }
            };
            $(list).find('span').eq(0).find('a').each((i, e) => {
                res.image.desktop.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(1).find('a').each((i, e) => {
                res.image.mobile.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            $(list).find('span').eq(2).find('a').each((i, e) => {
                res.image.tablet.push({
                    res: $(e).text().trim(),
                    url: this.base + $(e).attr('href')
                });
            });
            return res;
        } catch (e) {
            return e.message;
        }
    }
}

async function wallpaper4kCommand(sock, chatId, msg, args) {
    const wallpaper = new Wallpaper();
    const type = args[0] ? args[0].toLowerCase() : null;

    if (!type) {
        return sock.sendMessage(chatId, {
            text: `📌 *كيفية استخدام أمر 4kwallpaper*:

✅ لعرض الخلفيات حسب التصنيف:
• .4kwallpaper popular
• .4kwallpaper featured
• .4kwallpaper random
• .4kwallpaper collection

🔍 للبحث عن خلفية:
• .4kwallpaper search nature
• .4kwallpaper search car

📥 لتحميل الخلفية وإرسالها:
• .4kwallpaper dl [الرابط]

✳️ ملاحظة: البوت سيقوم بتحميل الصورة بأعلى دقة وإرسالها لك مباشرة.`
        }, { quoted: msg });
    }

    try {
        if (['popular', 'featured', 'random', 'collection'].includes(type)) {
            let targetUrl = `${wallpaper.base}/${type === 'popular' ? 'most-popular-4k-wallpapers/' : type === 'featured' ? 'best-4k-wallpapers/' : type === 'random' ? 'random-wallpapers/' : 'collections-packs/'}`;
            let { data } = await axios.get(targetUrl, { headers: wallpaper.headers });
            const $ = cheerio.load(data);
            let resultText = `🌆 *خلفيات (${type})*\n\n`;
            let count = 0;
            $('div#pics-list .wallpapers__item').each((i, e) => {
                if (count < 5) {
                    resultText += `*${count + 1}. ${$(e).find('.title2').text().trim()}*\n🔗 ${$(e).find('a').attr('href')}\n\n`;
                    count++;
                }
            });
            resultText += `📥 لتحميل أي واحدة، أرسل:\n.4kwallpaper dl [الرابط]`;
            return sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
        }

        if (type === 'search') {
            if (!args[1]) {
                return sock.sendMessage(chatId, { text: `❌ أكتب كلمة للبحث.\nمثال: .4kwallpaper search ocean` }, { quoted: msg });
            }
            let query = args.slice(1).join(' ');
            await sock.sendMessage(chatId, { text: `🔎 جاري البحث عن: ${query}...` }, { quoted: msg });
            let data = await wallpaper.search(query);
            if (typeof data === 'string') return sock.sendMessage(chatId, { text: data }, { quoted: msg });

            let resultText = `🔎 *نتائج البحث عن:* ${query}\n\n`;
            data.slice(0, 5).forEach((item, i) => {
                resultText += `*${i + 1}. ${item.title}*\n🔗 ${item.url}\n\n`;
            });
            resultText += `📥 لتحميل أي واحدة، أرسل:\n.4kwallpaper dl [الرابط]`;
            return sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
        }

        if (type === 'dl') {
            if (!args[1]) return sock.sendMessage(chatId, { text: '❌ أرسل رابط خلفية صالح.' }, { quoted: msg });

            await sock.sendMessage(chatId, { text: '⏳ جاري تحضير الخلفية بأعلى دقة... انتظر قليلاً.' }, { quoted: msg });

            let data = await wallpaper.download(args[1]);
            if (typeof data === 'string') return sock.sendMessage(chatId, { text: data }, { quoted: msg });

            // Try to get the highest resolution desktop wallpaper
            let bestRes = data.image.desktop[0] || data.image.mobile[0] || data.image.tablet[0];

            if (!bestRes) {
                return sock.sendMessage(chatId, { text: '❌ لم نتمكن من العثور على رابط تحميل مباشر.' }, { quoted: msg });
            }

            await sock.sendMessage(chatId, {
                image: { url: bestRes.url },
                caption: `✅ *${data.title}*\n\n🖥 الدقة: ${bestRes.res}\n⚔️ *Hamza Amirni Bot*`
            }, { quoted: msg });
            return;
        }

        return sock.sendMessage(chatId, { text: '❌ أمر غير معروف. أرسل `.4kwallpaper` للتعليمات.' }, { quoted: msg });

    } catch (error) {
        console.error('Wallpaper Error:', error);
        return sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء العمل على طلبك.' }, { quoted: msg });
    }
}

module.exports = wallpaper4kCommand;
