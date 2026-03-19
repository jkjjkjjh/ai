const config = require('../config')
const { cmd } = require('../command')

// Function to extract number from any ID format (normal or LID)
function extractNumber(id) {
    if (!id) return '';
    // Remove @s.whatsapp.net, @lid, or anything after : or @
    return id.replace(/@.*/g, '').replace(/:.*/g, '').trim();
}

// Function to check admin status with LID support
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        // Get bot IDs (both normal and LID)
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        const botNumber = extractNumber(botId);
        const botLidNumber = extractNumber(botLid);
        
        // Get sender number
        const senderNumber = extractNumber(senderId);
        
        // Get owner numbers from config
        const ownerNumbers = [];
        if (config.OWNER_NUMBER) {
            const owners = config.OWNER_NUMBER.split(',');
            for (let owner of owners) {
                ownerNumbers.push(extractNumber(owner.trim()));
            }
        }
        
        // Check if sender is owner
        const isOwner = ownerNumbers.includes(senderNumber);
        
        let isBotAdmin = false;
        let isSenderAdmin = false;
        
        for (let p of participants) {
            const isAdmin = p.admin === "admin" || p.admin === "superadmin";
            
            // Get participant numbers (both normal and LID)
            const pNumber = extractNumber(p.id);
            const pLidNumber = extractNumber(p.lid);
            
            // Check if this participant is the bot
            if (pNumber === botNumber || 
                pNumber === botLidNumber ||
                pLidNumber === botNumber || 
                pLidNumber === botLidNumber ||
                (botNumber && pNumber && pNumber.includes(botNumber)) ||
                (botNumber && pLidNumber && pLidNumber.includes(botNumber))) {
                if (isAdmin) {
                    isBotAdmin = true;
                }
            }
            
            // Check if this participant is the sender
            if (pNumber === senderNumber || 
                pLidNumber === senderNumber ||
                (senderNumber && pNumber && pNumber.includes(senderNumber)) ||
                (senderNumber && pLidNumber && pLidNumber.includes(senderNumber))) {
                if (isAdmin) {
                    isSenderAdmin = true;
                }
            }
        }
        
        return { isBotAdmin, isSenderAdmin, isOwner };
        
    } catch (err) {
        console.error('❌ Error checking admin status:', err);
        return { isBotAdmin: false, isSenderAdmin: false, isOwner: false };
    }
}

cmd({
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, reply, sender }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        
        // Get sender ID - handle all possible formats including LID
        let senderId = mek.key.participant || m?.participant || sender || m?.sender;
        
        // If message is from bot itself
        if (mek.key.fromMe) {
            senderId = conn.user?.id || conn.user?.lid;
        }
        
        if (!senderId) {
            return reply("❌ Could not identify sender.");
        }
        
        console.log('Raw Sender ID:', senderId);
        
        // Check admin status using LID-compatible function
        const { isBotAdmin, isSenderAdmin, isOwner } = await checkAdminStatus(conn, from, senderId);
        
        console.log('Is Owner:', isOwner);
        console.log('Is Sender Admin:', isSenderAdmin);
        console.log('Is Bot Admin:', isBotAdmin);
        
        // Allow both owner and group admins
        if (!isOwner && !isSenderAdmin) {
            return reply("❌ Only group admins or bot owner can use this command.");
        }
        
        if (!isBotAdmin) {
            return reply("❌ I need to be an admin to mute the group.");
        }
        
        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ Group has been muted. Only admins can send messages.");
        
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});
