const { sendWithChannelButton } = require('../lib/channelButton');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { t } = require('../lib/language');
const PDFDocument = require('pdfkit');

async function pdfCommand(sock, chatId, message, args, commands, userLang) {
    const text = args.join(' ').trim();
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isQuotedImage = quoted?.imageMessage;
    const isDirectImage = message.message?.imageMessage;

    // 1. Handle Photo to PDF (Local Conversion)
    if (isDirectImage || isQuotedImage) {
        try {
            await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
            await sock.sendMessage(chatId, { text: t('pdf.converting_image', {}, userLang) || "⏳ Converting image to PDF..." }, { quoted: message });

            const targetMsg = isQuotedImage ? { message: quoted } : message;
            // Fake context for downloadMediaMessage if quoted
            if (isQuotedImage) {
                targetMsg.key = {
                    remoteJid: chatId,
                    id: message.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: message.message.extendedTextMessage.contextInfo.participant
                };
            }

            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });

            if (!buffer) throw new Error("Failed to download image");

            const tempDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempFile = path.join(tempDir, `image_${Date.now()}.pdf`);

            // Create PDF locally
            const doc = new PDFDocument({ autoFirstPage: false });
            const stream = fs.createWriteStream(tempFile);
            doc.pipe(stream);

            const img = doc.openImage(buffer);
            doc.addPage({ size: [img.width, img.height] });
            doc.image(img, 0, 0);
            doc.end();

            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            await sock.sendMessage(chatId, {
                document: { url: tempFile },
                fileName: "image_converted.pdf",
                mimetype: "application/pdf",
                caption: t('pdf.success_image', { botName: settings.botName }, userLang) || "✅ PDF Created Successfully!"
            }, { quoted: message });

            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            return;

        } catch (e) {
            console.error('Photo to PDF Error:', e);
            const errMsg = userLang === 'ma' ? "❌ *وقع مشكل ف تحويل التصويرة.*" : "❌ *Error converting image.*";
            await sock.sendMessage(chatId, { text: errMsg }, { quoted: message });
            return;
        }
    }

    // 2. Handle Text to PDF
    const content = text || quoted?.conversation || quoted?.extendedTextMessage?.text;

    if (content) {
        try {
            await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

            // For Text, we still try to use PDFKit but it won't support Arabic well without fonts.
            // So we will stick to Local PDFKit for English/Latin, but warn or try API for others?
            // Actually, let's try local first. If it's simple text, it works.

            const tempDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempFile = path.join(tempDir, `text_${Date.now()}.pdf`);

            const doc = new PDFDocument();
            const stream = fs.createWriteStream(tempFile);
            doc.pipe(stream);

            // Simple text wrapping
            doc.fontSize(12).text(content, 100, 100);
            doc.end();

            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            await sock.sendMessage(chatId, {
                document: { url: tempFile },
                fileName: "text_converted.pdf",
                mimetype: "application/pdf",
                caption: t('pdf.success_text', { botName: settings.botName }, userLang) || "✅ PDF Created Successfully!"
            }, { quoted: message });

            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            return;

        } catch (e) {
            console.error('Text to PDF Error:', e);
            const errMsg = userLang === 'ma' ? "❌ *وقع مشكل ف تحويل النص.*" : "❌ *Error converting text.*";
            await sock.sendMessage(chatId, { text: errMsg }, { quoted: message });
            return;
        }
    }

    // 3. Show Usage Help
    const helpMsg = userLang === 'ma'
        ? `📄 *تحويل إلى PDF* 📄\n\n🔹 *الاستخدام:*\n1. صيفط تصويرة واكتب معاها ${settings.prefix}pdf\n2. أو جاوب على تصويرة بـ ${settings.prefix}pdf\n3. أو كتب نص: ${settings.prefix}pdf [النص]\n\n⚔️ ${settings.botName}`
        : `📄 *PDF Converter* 📄\n\n🔹 *Usage:*\n1. Send image with caption ${settings.prefix}pdf\n2. Reply to image with ${settings.prefix}pdf\n3. Type text: ${settings.prefix}pdf [text]`;

    return await sendWithChannelButton(sock, chatId, helpMsg, message);
}

module.exports = pdfCommand;
