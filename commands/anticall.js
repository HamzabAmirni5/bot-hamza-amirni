const { sendWithChannelButton } = require('../lib/channelButton');
const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) {
            // Default: enabled by default
            writeState(true);
            return { enabled: true };
        }
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: true }; // Default to enabled on error
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch { }
}

async function anticallCommand(sock, chatId, msg, args) {
    const { isOwner, sendOwnerOnlyMessage } = require('../lib/ownerCheck');

    // Owner-only command
    if (!isOwner(msg)) {
        return await sendOwnerOnlyMessage(sock, chatId, msg);
    }

    const state = readState();
    // args is an array if coming from handler.js
    const subText = Array.isArray(args) ? args[0] : args;
    const sub = (subText || '').trim().toLowerCase();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
        await sendWithChannelButton(sock, chatId, `📵 *نظام منع المكالمات - ANTICALL*
        
الحالة الافتراضية: *مفعّل دائماً* ✅

الأوامر:
• .anticall on  - تفعيل حظر المكالمات
• .anticall off - إيقاف الحظر مؤقتاً
• .anticall status - عرض الحالة الحالية

ملاحظة: النظام مفعل تلقائياً لحماية البوت

⚔️ bot hamza amirni` , msg);
        return;
    }

    if (sub === 'status') {
        const statusMsg = `📵 *حالة نظام منع المكالمات*

الحالة الحالية: ${state.enabled ? '✅ *مفعّل*' : '⚠️ *معطّل*'}

${state.enabled ? '🛡️ البوت محمي من المكالمات المزعجة' : '⚠️ تحذير: البوت غير محمي من المكالمات'}

⚔️ bot hamza amirni`;
        await sendWithChannelButton(sock, chatId, statusMsg, msg);
        return;
    }

    const enable = sub === 'on';
    writeState(enable);
    const responseMsg = `📵 *نظام منع المكالمات*

${enable ? '✅ تم التفعيل بنجاح!' : '⚠️ تم الإيقاف مؤقتاً'}

الحالة: ${enable ? '*مفعّل* 🛡️' : '*معطّل* ⚠️'}

⚔️ bot hamza amirni`;
    await sendWithChannelButton(sock, chatId, responseMsg, msg);
}

anticallCommand.readState = readState;
module.exports = anticallCommand;
