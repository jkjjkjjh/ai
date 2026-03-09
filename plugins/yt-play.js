const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "music",
    alias: ["play", "song", "audio", "roohi", "ayezal"],
    desc: "Download YouTube audio with thumbnail (Faa API)",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Faded Alan Walker");

        // Use new Faa API
        const api = `https://api-faa.my.id/faa/ytplay?q=${encodeURIComponent(q)}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json?.status || !json?.result?.mp3) {
            return await reply("❌ No results found or download failed!");
        }

        const result = json.result;
        const title = result.title || "Unknown Song";
        const thumbnail = result.thumbnail;
        const audioUrl = result.mp3;
        const duration = result.duration ? `${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}` : "Unknown";
        const views = result.views ? result.views.toLocaleString() : "Unknown";
        const author = result.author || "Unknown";
        const published = result.published || "Unknown";

        // 🎵 Send video thumbnail + info first
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${title}\n┇๏ *Author* - ${author}\n┇๏ *Duration* - ${duration}\n┇๏ *Views* - ${views}\n┇๏ *Published* - ${published}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *DARKZONE-MD*`
        }, { quoted: mek });

        // 🎧 Send final audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
