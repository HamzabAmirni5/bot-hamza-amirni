/**
   • الميزة: تعديل الصور بالذكاء الاصطناعي - نانو بنانا
   • المطور: حمزة اعمرني (����� 𝐀𝐌𝐈𝐑��)
   • القناة: https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p
**/

import axios from "axios";
import CryptoJS from "crypto-js";
import fs from "fs";
import path from "path";

const AES_KEY = "ai-enhancer-web__aes-key";
const AES_IV = "aienhancer-aesiv";

function encryptSettings(obj) {
    return CryptoJS.AES.encrypt(
        JSON.stringify(obj),
        CryptoJS.enc.Utf8.parse(AES_KEY),
        {
            iv: CryptoJS.enc.Utf8.parse(AES_IV),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    ).toString();
}

async function processImageAI(filePath, prompt) {
    try {
        const img = fs.readFileSync(filePath, "base64");

        const settings = encryptSettings({
            prompt,
            size: "2K",
            aspect_ratio: "match_input_image",
            output_format: "jpeg",
            max_images: 1
        });

        const headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
            "Content-Type": "application/json",
            Origin: "https://aienhancer.ai",
            Referer: "https://aienhancer.ai/ai-image-editor"
        };

        const create = await axios.post(
            "https://aienhancer.ai/api/v1/k/image-enhance/create",
            {
                model: 2,
                image: `data:image/jpeg;base64,${img}`,
                settings
            },
            { headers }
        );

        const id = create?.data?.data?.id;
        if (!id) throw new Error("لم يتم العثور على معرف المهمة");

        // Poll for result
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 3000));

            const r = await axios.post(
                "https://aienhancer.ai/api/v1/k/image-enhance/result",
                { task_id: id },
                { headers }
            );

            const data = r?.data?.data;
            if (!data) continue;

            if (data.status === "success") {
                return {
                    id,
                    output: data.output,
                    input: data.input
                };
            }

            if (data.status === "failed") {
                throw new Error(data.error || "فشلت العملية");
            }
        }

        throw new Error("استغرق الأمر وقتاً طويلاً جداً");

    } catch (e) {
        throw e;
    }
}

export default async function handler(sock, chatId, msg, args) {
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const mime = q?.imageMessage?.mimetype || q?.videoMessage?.mimetype || "";

    // Check if image is provided
    if (!mime.startsWith("image/")) {
        const usedPrefix = msg.prefix || ".";
        const command = args[0] || "نانو";
        return await sock.sendMessage(chatId, {
            text: `*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*\n*┊🦅┊:•⪼ ⌝خطأ⌞*\n> :•⪼ ⌝يرجى إرسال أو الرد على صورة⌞\n> :•⪼ ⌝مثال: ${usedPrefix}${command} تحويل الوجه إلى أنمي⌞\n*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*`
        }, { quoted: msg });
    }

    // Check if prompt is provided
    const text = args.slice(1).join(" ");
    if (!text) {
        const usedPrefix = msg.prefix || ".";
        const command = args[0] || "نانو";
        return await sock.sendMessage(chatId, {
            text: `*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*\n*┊🦅┊:•⪼ ⌝تنبيه⌞*\n> :•⪼ ⌝يرجى كتابة وصف التعديل⌞\n> :•⪼ ⌝مثال: ${usedPrefix}${command} تغيير الملابس إلى بدلة رسمية⌞\n*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*`
        }, { quoted: msg });
    }

    // React with loading
    await sock.sendMessage(chatId, {
        react: { text: "🕒", key: msg.key }
    });

    try {
        // Download the image
        const buffer = await sock.downloadMediaMessage(msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ?
            { message: msg.message.extendedTextMessage.contextInfo.quotedMessage } : msg);

        if (!buffer) throw new Error("فشل تحميل الصورة");

        const tmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filePath = path.join(tmpDir, `${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);

        const result = await processImageAI(filePath, text);

        const caption = `
*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*
*┊🦅┊:•⪼ ⌝تم تعديل الصورة بنجاح⌞*
*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*

↵📡╏الوصف ↶
> ⊢${text}╎❯

*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*
> 𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈
`.trim();

        await sock.sendMessage(
            chatId,
            {
                image: { url: result.output },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: "تعديل الصور بالذكاء الاصطناعي",
                        body: "𝐇𝐀𝐌𝐙𝐀 𝐀𝐌𝐈𝐑𝐍𝐈",
                        thumbnailUrl: result.output,
                        sourceUrl: "https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: msg }
        );

        // Clean up temp file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await sock.sendMessage(chatId, {
            react: { text: "✅", key: msg.key }
        });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(chatId, {
            text: `*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*\n*┊🦅┊:•⪼ ⌝فشل التعديل⌞*\n> :•⪼ ⌝تأكد من أن الصورة واضحة والوصف مفهوم⌞\n*⎔ ⋅ ───━ •﹝🦅﹞• ━─── ⋅ ⎔*`
        }, { quoted: msg });

        await sock.sendMessage(chatId, {
            react: { text: "❌", key: msg.key }
        });
    }
}

export const info = {
    name: "نانو",
    aliases: ["editimg", "nanobanana"],
    category: "ai",
    description: "تعديل صورة باستعمال نموذج نانو بنانا"
};
