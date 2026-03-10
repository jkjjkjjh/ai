const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: "imgedit",
    alias: ["editimg", "imageedit", "aiedit", "imgai"],
    desc: "Edit images with AI prompts (URL or Reply to image)",
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // Check if any input is provided
        if (!q && !quoted) {
            return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ⚠️ No input provided!
┃
┃ ✦ *Method 1:* Reply to image
┃   Reply to any image and type:
┃   .imgedit make it anime style
┃
┃ ✦ *Method 2:* Use image URL
┃   .imgedit [URL] [prompt]
┃   .imgedit https://example.com/img.jpg make it cartoon
┃
┃ ✦ *Examples:*
┃   .imgedit make it look like a painting
┃   .imgedit convert to anime style
┃   .imgedit add sunset background
┃   .imgedit make it cyberpunk
┃   .imgedit turn into cartoon
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        let imageUrl = '';
        let prompt = '';

        // Check if URL is provided in the query
        const urlRegex = /(https?:\/\/[^\s]+)/i;
        const urlMatch = q ? q.match(urlRegex) : null;

        if (urlMatch) {
            // Method 2: URL provided in query
            imageUrl = urlMatch[1];
            prompt = q.replace(urlRegex, '').trim();

            if (!prompt) {
                return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ⚠️ No prompt provided!
┃
┃ ➤ You provided URL but no prompt
┃
┃ ✦ Correct Usage:
┃   .imgedit [URL] [prompt]
┃
┃ ✦ Example:
┃   .imgedit https://example.com/img.jpg make it anime
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
            }

        } else if (quoted) {
            // Method 1: Reply to image
            const mimeType = quoted.mimetype || '';
            
            if (!mimeType.startsWith('image')) {
                return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ❌ Invalid media type!
┃
┃ ➤ Please reply to an IMAGE only
┃
┃ ✦ Supported: JPG, PNG, WEBP
┃
┃ ✦ Or use URL method:
┃   .imgedit [URL] [prompt]
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
            }

            if (!q) {
                return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ⚠️ No prompt provided!
┃
┃ ➤ Reply to image WITH a prompt
┃
┃ ✦ Example:
┃   .imgedit make it look like anime
┃   .imgedit add cyberpunk effect
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
            }

            prompt = q.trim();

            // Processing reaction
            await conn.sendMessage(from, {
                react: { text: '⏳', key: m.key }
            });

            await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ 🔄 Processing your image...
┃
┃ 📝 *Prompt:* ${prompt}
┃ 📷 *Source:* Replied Image
┃
┃ ⏱️ Please wait...
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);

            // Download the image from quoted message
            const mediaBuffer = await quoted.download();

            // Upload image to Telegraph to get URL
            const formData = new FormData();
            formData.append('file', mediaBuffer, {
                filename: 'image.jpg',
                contentType: mimeType
            });

            const uploadResponse = await axios.post('https://telegra.ph/upload', formData, {
                headers: formData.getHeaders()
            });

            if (!uploadResponse.data || !uploadResponse.data[0]?.src) {
                throw new Error('Failed to upload image to server');
            }

            imageUrl = 'https://telegra.ph' + uploadResponse.data[0].src;

        } else {
            // No URL in query and no quoted message
            return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ❌ No image found!
┃
┃ ✦ *Method 1:* Reply to image
┃   Reply to any image and type:
┃   .imgedit make it anime style
┃
┃ ✦ *Method 2:* Use image URL
┃   .imgedit [URL] [prompt]
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        // If URL method was used, send processing message now
        if (urlMatch) {
            await conn.sendMessage(from, {
                react: { text: '⏳', key: m.key }
            });

            await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ 🔄 Processing your image...
┃
┃ 📝 *Prompt:* ${prompt}
┃ 🔗 *Source:* URL
┃
┃ ⏱️ Please wait...
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        // Call the AI Image Editor API
        const apiUrl = `https://api.giftedtech.co.ke/api/tools/imgeditor?apikey=gifted&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

        const response = await axios.get(apiUrl, { timeout: 120000 });
        const data = response.data;

        if (!data.success || !data.result?.imageUrl) {
            await conn.sendMessage(from, {
                react: { text: '❌', key: m.key }
            });
            return await reply(`╭━〔 ❌ EDIT FAILED 〕━⬣
┃ Unable to edit the image.
┃
┃ ➤ Possible Reasons:
┃   • API server busy
┃   • Invalid prompt
┃   • Image too large
┃   • Invalid image URL
┃
┃ Please try again later.
╰━━━━━━━━━━━━━━━━━━⬣
> 🎨 DARKZONE-MD Image Editor`);
        }

        const editedImageUrl = data.result.imageUrl;

        // Send edited image
        await conn.sendMessage(from, {
            image: { url: editedImageUrl },
            caption: `╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ✅ Image edited successfully!
┃
┃ 📝 *Prompt:* ${prompt}
┃ 🆔 *Task ID:* ${data.result.taskId || 'N/A'}
╰━━━━━━━━━━━━━━━━━━⬣
> ⚡ Powered by DARKZONE-MD`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

    } catch (error) {
        console.error('Image Edit error:', error);

        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });

        await reply(`╭━〔 🚨 ERROR 〕━⬣
┃ Something went wrong!
┃
┃ ❌ Error: ${error.message}
┃
┃ Please try again later.
╰━━━━━━━━━━━━━━━━━━⬣
> 🛠️ DARKZONE-MD System`);
    }
});
