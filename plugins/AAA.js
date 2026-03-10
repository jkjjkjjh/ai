const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "imgedit",
    alias: ["editimg", "imageedit", "aiedit", "imgai"],
    desc: "Edit images with AI prompts",
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // Check if prompt is provided
        if (!q) {
            return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ⚠️ No prompt provided!
┃
┃ ➤ Reply to an image with prompt
┃
┃ ✦ Examples:
┃   .imgedit make it look like a painting
┃   .imgedit convert to anime style
┃   .imgedit add sunset background
┃   .imgedit make it cyberpunk
┃   .imgedit turn into cartoon
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        // Check if replying to a message
        if (!quoted) {
            return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ❌ No image found!
┃
┃ ➤ Please reply to an image
┃
┃ ✦ How to use:
┃   1. Find any image
┃   2. Reply to it
┃   3. Type: .imgedit your prompt
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        // Check if quoted message is an image
        const mimeType = quoted.mimetype || '';
        if (!mimeType.startsWith('image')) {
            return await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ ❌ Invalid media type!
┃
┃ ➤ Please reply to an IMAGE only
┃
┃ ✦ Supported: JPG, PNG, WEBP
╰━━━━━━━━━━━━━━━━━━⬣
> 🚀 Powered by DARKZONE-MD`);
        }

        // Processing reaction
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        await reply(`╭━〔 🎨 AI IMAGE EDITOR 〕━⬣
┃ 🔄 Processing your image...
┃
┃ 📝 *Prompt:* ${q}
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
            throw new Error('Failed to upload image');
        }

        const imageUrl = 'https://telegra.ph' + uploadResponse.data[0].src;

        // Call the AI Image Editor API
        const apiUrl = `https://api.giftedtech.co.ke/api/tools/imgeditor?apikey=gifted&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(q)}`;

        const response = await axios.get(apiUrl, { timeout: 60000 });
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
┃ 📝 *Prompt:* ${q}
┃
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
