const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const settings = require('../settings');

async function stupidCommand(sock, chatId, msg, args) {
    try {
        const sender = msg.key.participant || msg.key.remoteJid;
        const msgText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.participant;

        // Determine the target user
        let who = quotedMsg
            ? quotedMsg
            : mentionedJid && mentionedJid[0]
                ? mentionedJid[0]
                : sender;

        // Get the profile picture URL
        let avatarUrl;
        try {
            avatarUrl = await sock.profilePictureUrl(who, 'image');
        } catch (error) {
            avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // Default avatar
        }

        const templatePath = path.join(__dirname, '../assets/stupid_ma.png');

        if (!fs.existsSync(templatePath)) {
            // Fallback to legacy API if template is missing but keep it as a backup
            const fallbackUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=أنا مكلخ`;
            const response = await fetch(fallbackUrl);
            const imageBuffer = await response.buffer();
            return await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: `*@${who.split('@')[0]}*`,
                mentions: [who]
            }, { quoted: msg });
        }

        // Processing with Local Moroccan Template
        const template = await Jimp.read(templatePath);
        const avatar = await Jimp.read(avatarUrl);

        // Template is 1024x1024 (generated)
        template.resize(1024, 1024);

        // Resize avatar to fit head area
        avatar.resize(250, 250);

        // Simple circular crop (modern Jimp might not have .circle(), let's check or use fallback)
        // If jimp 1.6.0+, it's different. Let's use custom circle mask if needed.
        if (typeof avatar.circle === 'function') {
            avatar.circle();
        } else {
            // Manual circular mask for older/different Jimp versions
            const radius = 125;
            avatar.scan(0, 0, avatar.bitmap.width, avatar.bitmap.height, function (x, y, idx) {
                const distance = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
                if (distance > radius) {
                    this.bitmap.data[idx + 3] = 0;
                }
            });
        }

        // Composite onto Panel 2 (Top Right)
        // Panel 2 x start: 512. 
        // Based on the generated image 'moroccan_stupid_meme_template_1766871100237.png':
        // The dog head is roughly at x=780, y=320 center.
        // For x=780 center, start x = 780 - 125 = 655
        // For y=320 center, start y = 320 - 125 = 195

        template.composite(avatar, 665, 235);

        const imageBuffer = await template.getBufferAsync(Jimp.MIME_PNG);

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `*@${who.split('@')[0]}*`,
            mentions: [who]
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in stupid command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ وقع شي غلاط وما قدرتش نصايب ليك التصويرة. عاود جرب من بعد!'
        }, { quoted: msg });
    }
}

module.exports = stupidCommand;
