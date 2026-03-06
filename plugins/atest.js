const { cmd } = require('../command');

cmd({
    pattern: "groupstatus",
    alias: ["gstatuss", "grpstatus"],
    react: "📊",
    desc: "Show info about WhatsApp Group Status feature",
    category: "group",
    use: ".groupstatus",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, groupMetadata, reply }) => {
    try {

        // ── Only works inside a group ──────────────────────────────────────
        if (!isGroup) {
            return reply("❌ This command can only be used inside a group!");
        }

        const groupName    = groupMetadata?.subject        || "This Group";
        const groupDesc    = groupMetadata?.desc           || "No description set.";
        const totalMembers = groupMetadata?.participants?.length || 0;
        const groupOwner   = groupMetadata?.owner          || "Unknown";
        const createdAt    = groupMetadata?.creation
            ? new Date(groupMetadata.creation * 1000).toLocaleDateString("en-PK", {
                year: "numeric", month: "long", day: "numeric"
              })
            : "Unknown";

        // ── Count admins ───────────────────────────────────────────────────
        const admins = groupMetadata?.participants
            ?.filter(p => p.admin === "admin" || p.admin === "superadmin")
            ?.length || 0;

        // ── Build the info message ─────────────────────────────────────────
        const infoText =
`📊 *GROUP STATUS INFO*
━━━━━━━━━━━━━━━━━━━━━━

👥 *Group Name:* ${groupName}
📝 *Description:* ${groupDesc}
👤 *Total Members:* ${totalMembers}
🛡️ *Admins:* ${admins}
👑 *Owner:* @${groupOwner.split("@")[0]}
📅 *Created On:* ${createdAt}

━━━━━━━━━━━━━━━━━━━━━━
📌 *About Group Status Feature:*

• Members can share photos & videos as a *Group Status* without sending a message to the chat.
• All group members can *view and reply* to group statuses.
• Group statuses *automatically disappear after 24 hours*.
• Statuses appear as a *story-style ring* around the group icon.
• You can react to a status with ❤️ or reply directly to the poster.
• Only group members can see the group status — it is *private to the group*.

━━━━━━━━━━━━━━━━━━━━━━
*DARKZONE-MD*`;

        // ── Send the message ───────────────────────────────────────────────
        await conn.sendMessage(from, {
            text: infoText,
            mentions: [groupOwner],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363416743041101@newsletter',
                    newsletterName: "DARKZONE-MD",
                    serverMessageId: 143,
                },
            },
        }, { quoted: m });

    } catch (error) {
        console.error("GroupStatus Command Error:", error);
        reply("❌ An error occurred while fetching group status info.");
    }
});
