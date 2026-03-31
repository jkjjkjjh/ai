const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (UNCHANGED)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv2",
    alias: ["ytmp42", "video2"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv alone marshmello`");

        let url = q;
        let videoInfo = null;

        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link! Try again later.");
        }

        const vid = data.result;

        await conn.sendMessage(from, {
            video: { url: vid.mp4 },
            caption: `🎬 *${vid.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ═══════════════════════════════════════════════════════════
// 🎵 SONG COMMAND (FIXED - 2 APIs ONLY)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "song",
    alias: ["play", "music", "audio", "aa"],
    desc: "Download YouTube song with multiple API fallback",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text) {
            return reply("❌ Please provide song name\nExample: .song Shape of You")
        }

        // 🔍 YouTube search
        const search = await yts(text)
        if (!search.videos || !search.videos.length) {
            return reply("❌ No song found!")
        }

        const vid = search.videos[0]

        // 🎨 DARKZONE-MD STYLE BOX
        const caption = `
*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰  DARKZONE-MD ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│❀ 🎵 𝐓𝐢𝐭𝐥𝐞:* ${vid.title}
*│❀ 📀 𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* 128kbps
*│❀ 📁 𝐅𝐨𝐫𝐦𝐚𝐭:* mp3
*│❀ ⚙️ 𝐒𝐭𝐚𝐭𝐮𝐬:* Downloading...
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ DARKZONE-MD`

        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption
        }, { quoted: mek })

        let audioBuffer = null
        let downloadSuccess = false

        // ═══════════════════════════════════════════════════════════
        // 🔷 API 1: EliteProTech API (Primary - Direct MP3)
        // ═══════════════════════════════════════════════════════════
        if (!downloadSuccess) {
            try {
                const api1 = `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(vid.url)}`
                const res1 = await axios.get(api1, { timeout: 30000 })

                if (res1.data?.status && res1.data?.result?.download) {
                    const audioUrl = res1.data.result.download
                    const audioRes = await axios.get(audioUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 60000 
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 1 (EliteProTech) Success!")
                }
            } catch (e) {
                console.log("❌ API 1 Failed:", e.message)
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 🔷 API 2: GiftedTech API (Backup - Direct MP3)
        // ═══════════════════════════════════════════════════════════
        if (!downloadSuccess) {
            try {
                const api2 = `https://api.giftedtech.co.ke/api/download/ytmp3v2?apikey=gifted&url=${encodeURIComponent(vid.url)}&quality=128`
                const res2 = await axios.get(api2, { timeout: 30000 })

                const result = res2.data.result || res2.data.results || res2.data
                const audioUrl = result.download_url || result.downloadUrl || result.url || result.audio || result.link

                if (audioUrl) {
                    const audioRes = await axios.get(audioUrl, { 
                        responseType: 'arraybuffer', 
                        timeout: 60000 
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 2 (GiftedTech) Success!")
                }
            } catch (e) {
                console.log("❌ API 2 Failed:", e.message)
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 📤 Send Audio or Error Message
        // ═══════════════════════════════════════════════════════════
        if (downloadSuccess && audioBuffer) {
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${vid.title}.mp3`,
                ptt: false
            }, { quoted: mek })

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } })
            console.log(`✅ Song sent successfully!`)
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } })
            return reply("❌ API Error! Please try again later.")
        }

    } catch (err) {
        console.error("❌ SONG ERROR:", err)
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } })
        reply("❌ API Error! Please try again later.")
    }
})
