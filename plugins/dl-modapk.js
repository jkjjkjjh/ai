const { cmd } = require('../command');
const axios = require('axios');

const AXIOS = axios.create({
    timeout: 60000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
});

async function fetchModAPK(url) {
    const api = `https://arslan-apis.vercel.app/download/modwhatsappdl?url=${encodeURIComponent(url)}`;
    const res = await AXIOS.get(api);
    
    if (res.data?.status) {
        // Replace below with actual download link if API provides it
        return {
            title: url.split("/").pop() || "Mod APK",
            creator: res.data.creator || "Unknown",
            url: url,
            thumb: "https://files.catbox.moe/4964gx.jpg" // Replace with your own thumbnail if needed
        };
    }
    throw new Error("API failed");
}

cmd({
    pattern: "modapk",
    react: "📥",
    desc: "Download mod APK with thumbnail and document/video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) return reply("❌ Use: .modapk <APK URL>");

        const apkURL = args[0];
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const data = await fetchModAPK(apkURL);

        const caption =
`┌─⭓ *📱 Mod APK Details* ⭓
│
│ 🎬 Title: ${data.title}
│ 🛠 Creator: ${data.creator}
│ 📥 Download: Document / Video
│
└─────────────
© Presented by DARKZONE-MD`;

        // 🔹 Send one clean message with thumbnail + document
        await conn.sendMessage(from, {
            document: { url: data.url },
            mimetype: "application/vnd.android.package-archive",
            fileName: `${data.title}.apk`,
            caption,
            contextInfo: {
                externalAdReply: {
                    title: data.title,
                    body: `Creator: ${data.creator}`,
                    thumbnailUrl: data.thumb,
                    sourceUrl: data.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.log(e);
        reply("❌ Bhai APK download nahi ho saka bc");
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
