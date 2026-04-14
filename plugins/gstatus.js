const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const converter = require('../data/converter');

const OWNER_PATH = path.join(__dirname, "../lib/sudo.json");

const loadSudo = () => {
    try {
        return JSON.parse(fs.readFileSync(OWNER_PATH, "utf-8"));
    } catch {
        return [];
    }
};

const isAuthorized = (sender, isCreator) => {
    if (isCreator) return true;
    const sudoOwners = loadSudo();
    return sudoOwners.some(owner => owner === sender);
};

cmd({
    pattern: "gstatus",
    alias: ["groupstatus", "gcstatus"],
    desc: "Post group status with media or text (mentions all members)",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, isGroup, sender }) => {

    if (!isAuthorized(sender, isCreator)) return reply("❌ This command is only for owners!");

    if (!isGroup) return reply("❌ This command can only be used in groups!");

    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || "";

        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Examples:\n` +
                `• .gcstatus Hello everyone\n` +
                `• Reply to an image with: .gcstatus\n` +
                `• Reply to an image with: .gcstatus my caption`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);

        let messageContent = {};

        if (quotedMsg) {
            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");

            const contextInfo = {
                isGroupStatus: true,
                mentionedJid: mentionedJid
            };

            if (mimeType.startsWith('image/') || quotedMsg.mtype === 'imageMessage') {
                messageContent = {
                    image: mediaBuffer,
                    caption: caption || quotedMsg.msg?.caption || "",
                    mimetype: mimeType || 'image/jpeg',
                    contextInfo: contextInfo
                };
            }

            else if (mimeType.startsWith('video/') || quotedMsg.mtype === 'videoMessage') {
                messageContent = {
                    video: mediaBuffer,
                    caption: caption || quotedMsg.msg?.caption || "",
                    mimetype: mimeType || 'video/mp4',
                    contextInfo: contextInfo
                };
            }

            else if (mimeType.startsWith('audio/') || quotedMsg.mtype === 'audioMessage' || quotedMsg.mtype === 'pttMessage') {

                const duration = quotedMsg.msg?.seconds || 0;
                if (duration > 600) return reply("❌ Audio too long! Max 10 minutes allowed.");

                const ext =
                    quotedMsg.mtype === 'videoMessage' ? 'mp4' :
                    quotedMsg.mtype === 'audioMessage' ? 'm4a' :
                    mimeType.includes('mp4') ? 'mp4' : 'm4a';

                let pttBuffer;
                try {
                    pttBuffer = await converter.toPTT(mediaBuffer, ext);
                } catch (e) {
                 
                    pttBuffer = mediaBuffer;
                }

                messageContent = {
                    audio: pttBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: contextInfo
                };
            }

            else {
                const msgType = Object.keys(quotedMsg.message || {})[0];

                if (msgType === 'imageMessage') {
                    messageContent = {
                        image: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'image/jpeg',
                        contextInfo: contextInfo
                    };
                }
                else if (msgType === 'videoMessage') {
                    messageContent = {
                        video: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'video/mp4',
                        contextInfo: contextInfo
                    };
                }
                else if (msgType === 'audioMessage' || msgType === 'pttMessage') {
                    const ext = msgType === 'videoMessage' ? 'mp4' : 'm4a';
                    let pttBuffer;
                    try {
                        pttBuffer = await converter.toPTT(mediaBuffer, ext);
                    } catch (e) {
                        pttBuffer = mediaBuffer;
                    }
                    messageContent = {
                        audio: pttBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        contextInfo: contextInfo
                    };
                }
                else {
                    return reply("❌ Unsupported media type!");
                }
            }
        }

        else if (caption) {
            messageContent = {
                text: caption,
                contextInfo: {
                    isGroupStatus: true,
                    mentionedJid: mentionedJid
                }
            };
        }

        await conn.sendMessage(from, messageContent, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Group Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
