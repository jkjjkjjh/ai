const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

// ═══════════════════════════════════════════════════════════
// 🖼️ IMAGE SEARCH FUNCTION (NEW API)
// ═══════════════════════════════════════════════════════════
function getGoogleImageSearch(query) {
    const getAll = async () => {
        try {
            const url = `https://api.giftedtech.co.ke/api/search/googleimage?apikey=gifted&query=${encodeURIComponent(query)}`
            const res = await axios.get(url, { timeout: 30000 })
            
            // Check if response is successful
            if (res.data?.success && Array.isArray(res.data?.results)) {
                // Filter valid URLs
                const urls = res.data.results.filter(u => typeof u === 'string' && u.startsWith('http'))
                return urls
            }
            return []
        } catch (err) {
            console.log("❌ Image API Error:", err.message)
            return []
        }
    }
    
    return { 
        getAll,
        getRandom: async () => {
            const all = await getAll()
            return all[Math.floor(Math.random() * all.length)] || null
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 🖼️ IMAGE SEARCH COMMAND
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "imagen",
    alias: ["image", "img", "gimage"],
    react: "🖼️",
    desc: "Search for images from Google",
    category: "search",
    use: ".imagen <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`🖼️ Please enter a text to search for images!\n\nExample:\n.imagen Cute Cat\n.img Beautiful Nature`)

        await reply("🔍 *Searching for images... Please wait!*")

        const res = await getGoogleImageSearch(q)
        const urls = await res.getAll()
        
        // Check if images found
        if (!urls || urls.length === 0) {
            return reply('❌ No images found! Please try again later.')
        }
        
        if (urls.length < 2) {
            return reply('❌ Not enough images found for album.')
        }
        
        // Take maximum 10 images
        const medias = urls.slice(0, 10).map(url => ({ image: { url } }))
        
        // Send images one by one
        for (let media of medias) {
            try {
                await conn.sendMessage(from, media, { quoted: mek })
            } catch (e) {
                console.log("❌ Failed to send image:", e.message)
            }
        }
        
        // Send caption
        const caption = `*╭───────────────────╮*
*│    🖼️ IMAGE SEARCH RESULTS    │*
*╰───────────────────╯*

🔍 *Query:* ${q}
📸 *Images Found:* ${medias.length}

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ DARKZONE-MD`
        
        await conn.sendMessage(from, { text: caption }, { quoted: mek })
        
        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } })

    } catch (error) {
        console.error('❌ Image Search Error:', error)
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } })
        reply(`❌ API Error! Please try again later.`)
    }
})
