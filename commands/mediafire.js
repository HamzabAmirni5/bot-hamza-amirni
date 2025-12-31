const { sendWithChannelButton } = require('../lib/channelButton');
const axios = require('axios');
const cheerio = require('cheerio');
const { t } = require('../lib/language');
const settings = require('../settings');

async function getMediaFireDownload(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract download info
        const downloadButton = $('#downloadButton');
        const downloadUrl = downloadButton.attr('href');

        // Extract file info
        const fileName = $('.dl-btn-label').attr('title') ||
            $('div.filename').text().trim() ||
            'file';

        const fileSize = $('a#downloadButton').text().match(/\(([^)]+)\)/)?.[1] ||
            $('.details li').first().text().trim() ||
            'Unknown';

        const fileType = $('.filetype').text().trim() ||
            fileName.split('.').pop() ||
            'file';

        return {
            url: downloadUrl,
            fileName: fileName,
            fileSize: fileSize,
            fileType: fileType,
            originalUrl: url
        };
    } catch (error) {
        console.error('Error parsing MediaFire:', error);
        throw new Error('Parsing error');
    }
}

async function mediafireCommand(sock, chatId, message, args, commands, userLang) {
    const url = args.join(' ').trim();

    if (!url) {
        await sendWithChannelButton(sock, chatId, t('download.mediafire_usage', {}, userLang), message);
        return;
    }

    // Check if it's a valid MediaFire URL
    if (!url.includes('mediafire.com')) {
        await sendWithChannelButton(sock, chatId, t('download.mediafire_invalid', {}, userLang), message);
        return;
    }

    try {
        await sendWithChannelButton(sock, chatId, t('download.mediafire_processing', {}, userLang), message);

        // Get download info
        const fileInfo = await getMediaFireDownload(url);

        if (!fileInfo.url) {
            await sendWithChannelButton(sock, chatId, t('download.mediafire_error', {}, userLang), message);
            return;
        }

        // Send file info
        const infoMsg = t('download.mediafire_info', {
            name: fileInfo.fileName,
            size: fileInfo.fileSize,
            type: fileInfo.fileType
        }, userLang);

        await sendWithChannelButton(sock, chatId, infoMsg, message);

        // Download using streams (memory safe)
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const safeFileName = fileInfo.fileName.replace(/[\\/:*?"<>|]/g, '_');
        const tempFile = path.join(tempDir, safeFileName);

        const writer = fs.createWriteStream(tempFile);

        const downloadResponse = await axios({
            url: fileInfo.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 600000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        downloadResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Determine mimetype
        let mimetype = 'application/octet-stream';
        const ext = fileInfo.fileName.split('.').pop().toLowerCase();

        const mimetypes = {
            'apk': 'application/vnd.android.package-archive',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'pdf': 'application/pdf',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };

        if (mimetypes[ext]) {
            mimetype = mimetypes[ext];
        }

        // Check size (max 99MB for safety)
        const stats = fs.statSync(tempFile);
        if (stats.size > 99 * 1024 * 1024) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            throw new Error('File too large (max 99MB)');
        }

        // Send the file from path
        await sock.sendMessage(chatId, {
            document: { url: tempFile },
            fileName: fileInfo.fileName,
            mimetype: mimetype,
            caption: t('download.mediafire_success', {
                name: fileInfo.fileName,
                size: fileInfo.fileSize,
                botName: settings.botName
            }, userLang)
        }, { quoted: message });

        // Cleanup after sending
        // Note: We leave cleanup to system or auto-cleanup script, or use valid cleanup here.
        // But Baileys { url: path } might need the file to exist until sent.
        setTimeout(() => {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }, 30000); // 30s buffer

    } catch (error) {
        console.error('Error in mediafire command:', error);

        let errorMsg = t('download.mediafire_error', {}, userLang);

        if (error.message.includes('maxContentLength') || error.message.includes('50MB')) {
            errorMsg = t('download.mediafire_error_large', {}, userLang);
        } else if (error.message.includes('timeout')) {
            errorMsg = t('download.apk_error_timeout', {}, userLang);
        } else if (error.response && error.response.status === 404) {
            errorMsg = t('download.mediafire_invalid', {}, userLang);
        }

        await sendWithChannelButton(sock, chatId, errorMsg, message);
    }
}

module.exports = mediafireCommand;
