const fetch = require('node-fetch');
const FormData = require('form-data');
const FileType = require('file-type');
const fs = require('fs');
const path = require('path');

/**
 * Upload file to Tioxy (Master) or Fallback to qu.ax/telegraph
 * @param {Buffer} buffer File Buffer
 * @return {Promise<string>}
 */
async function uploadImage(buffer) {
    try {
        // 1. Try Tioxy CDN (High Speed)
        try {
            const fileType = await FileType.fromBuffer(buffer);
            const { ext, mime } = fileType || { ext: 'png', mime: 'image/png' };
            const form = new FormData();
            form.append('file', buffer, {
                filename: 'upload.' + ext,
                contentType: mime
            });

            const tioxyRes = await fetch('https://cdn.tioxy.my.id/api/upload', {
                method: 'POST',
                body: form,
                headers: form.getHeaders()
            });
            const img = await tioxyRes.json();
            if (img.status && img.result?.url) return img.result.url;
            if (img.url) return img.url;
        } catch (e) {
            console.log('Tioxy failed, trying backup...');
        }

        // 2. Fallback to qu.ax
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const fileInfo = await FileType.fromBuffer(buffer);
        const { ext, mime } = fileInfo || { ext: 'png', mime: 'image/png' };
        const tempFile = path.join(tmpDir, `temp_${Date.now()}.${ext}`);
        fs.writeFileSync(tempFile, buffer);

        const formQuax = new FormData();
        formQuax.append('files[]', fs.createReadStream(tempFile));

        const response = await fetch('https://qu.ax/upload.php', {
            method: 'POST',
            body: formQuax,
            headers: formQuax.getHeaders()
        });
        fs.unlinkSync(tempFile);

        const result = await response.json();
        if (result && result.success) return result.files[0].url;

        // 3. Last Resort: Telegra.ph
        const teleForm = new FormData();
        teleForm.append('file', buffer, {
            filename: `upload.${ext}`,
            contentType: mime
        });
        const teleRes = await fetch('https://telegra.ph/upload', { method: 'POST', body: teleForm });
        const teleImg = await teleRes.json();
        if (teleImg[0]?.src) return 'https://telegra.ph' + teleImg[0].src;

        throw new Error('All uploaders failed');
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

module.exports = { uploadImage };