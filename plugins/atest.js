const config = require('../config')
const { cmd } = require('../command')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

// Helper function to download media
async function downloadMedia(message) {
    const mtype = Object.keys(message)[0];
    const msg = message[mtype];
    const stream = await downloadContentFromMessage(msg, mtype.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

cmd({
    pattern: "gstatus",
    alias: ["groupstatus", "gstat", "statusgroup", "gs"],
    react: "📢",
    desc: "Post a status visible to the current group",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, reply, args, q, quoted, isCreator, isOwner }) => {
    try {
        // Only in groups
        if (!isGroup) {
            return reply("❌ This command can only be used in groups!");
        }
        
        // Only owner/sudo can post status
        if (!isCreator && !isOwner) {
            return reply("❌ Only bot owner can use this command!");
        }

        const text = q || '';
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // ============ CASE 1: Reply to Image ============
        if (quotedMsg?.imageMessage) {
            const media = await downloadMedia({ imageMessage: quotedMsg.imageMessage });
            
            await conn.sendMessage('status@broadcast', {
                image: media,
                caption: text || quotedMsg.imageMessage.caption || ''
            }, {
                statusJidList: [from]
            });
            
            return reply("✅ *Image Status Posted!*\n📢 Visible to this group.");
        }
        
        // ============ CASE 2: Reply to Video ============
        if (quotedMsg?.videoMessage) {
            const media = await downloadMedia({ videoMessage: quotedMsg.videoMessage });
            
            await conn.sendMessage('status@broadcast', {
                video: media,
                caption: text || quotedMsg.videoMessage.caption || ''
            }, {
                statusJidList: [from]
            });
            
            return reply("✅ *Video Status Posted!*\n📢 Visible to this group.");
        }
        
        // ============ CASE 3: Reply to Audio ============
        if (quotedMsg?.audioMessage) {
            const media = await downloadMedia({ audioMessage: quotedMsg.audioMessage });
            
            await conn.sendMessage('status@broadcast', {
                audio: media,
                mimetype: 'audio/mp4',
                ptt: true
            }, {
                statusJidList: [from]
            });
            
            return reply("✅ *Audio Status Posted!*\n📢 Visible to this group.");
        }
        
        // ============ CASE 4: Text Only Status ============
        if (text) {
            // Text status with background color
            const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', '#FFD700', '#8B00FF'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            await conn.sendMessage('status@broadcast', {
                text: text,
                backgroundColor: randomColor,
                font: Math.floor(Math.random() * 5)
            }, {
                statusJidList: [from]
            });
            
            return reply("✅ *Text Status Posted!*\n📢 Visible to this group.");
        }
        
        // ============ No Input Provided ============
        return reply(`❌ *How to use:*

📝 *Text Status:*
${config.PREFIX}gstatus Hello World

🖼️ *Image Status:*
Reply to image with ${config.PREFIX}gstatus caption here

🎬 *Video Status:*
Reply to video with ${config.PREFIX}gstatus caption here

🎵 *Audio Status:*
Reply to audio/voice with ${config.PREFIX}gstatus`);
        
    } catch (e) {
        console.error("Group Status Error:", e);
        reply("❌ Failed to post status!\nError: " + e.message);
    }
});

// ============ POST STATUS TO ALL GROUPS ============
cmd({
    pattern: "allgstatus",
    alias: ["statusall", "astat"],
    react: "🌐",
    desc: "Post status visible to ALL groups",
    category: "owner",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, reply, args, q, quoted, isCreator, isOwner }) => {
    try {
        if (!isCreator && !isOwner) {
            return reply("❌ Only bot owner can use this command!");
        }

        const text = q || '';
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Get all groups
        const groups = await conn.groupFetchAllParticipating();
        const groupJids = Object.keys(groups);
        
        if (groupJids.length === 0) {
            return reply("❌ Bot is not in any groups!");
        }

        // Image Status to all groups
        if (quotedMsg?.imageMessage) {
            const media = await downloadMedia({ imageMessage: quotedMsg.imageMessage });
            
            await conn.sendMessage('status@broadcast', {
                image: media,
                caption: text || quotedMsg.imageMessage.caption || ''
            }, {
                statusJidList: groupJids
            });
            
            return reply(`✅ *Image Status Posted!*\n📢 Visible to ${groupJids.length} groups.`);
        }
        
        // Video Status to all groups
        if (quotedMsg?.videoMessage) {
            const media = await downloadMedia({ videoMessage: quotedMsg.videoMessage });
            
            await conn.sendMessage('status@broadcast', {
                video: media,
                caption: text || quotedMsg.videoMessage.caption || ''
            }, {
                statusJidList: groupJids
            });
            
            return reply(`✅ *Video Status Posted!*\n📢 Visible to ${groupJids.length} groups.`);
        }
        
        // Text Status to all groups
        if (text) {
            const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            await conn.sendMessage('status@broadcast', {
                text: text,
                backgroundColor: randomColor,
                font: Math.floor(Math.random() * 5)
            }, {
                statusJidList: groupJids
            });
            
            return reply(`✅ *Text Status Posted!*\n📢 Visible to ${groupJids.length} groups.`);
        }
        
        return reply(`❌ Please provide text or reply to media!`);
        
    } catch (e) {
        console.error("All Group Status Error:", e);
        reply("❌ Failed! Error: " + e.message);
    }
});
