const axios = require('axios');
const yts = require('youtube-search-api');

module.exports = async function play2(sock, m, text, from) {
    try {
        const query = text.split('.play2 ')[1];
        if (!query) return await sock.sendMessage(from, {
            text: '❌ Escribe el nombre de un video para buscar.\n\n📝 Ejemplo: *.play2 Karol G - Provenza*',
            quoted: m
        });

        await sock.sendMessage(from, {
            text: `📹 *Buscando video:* _${query}_\n\n⏳ *Espera un momento...*`,
            quoted: m
        });

        const results = await yts.GetListByKeyword(query, false, 1);
        const video = results.items.find(v => v.type === "video");

        if (!video) {
            return await sock.sendMessage(from, {
                text: '❌ No se encontró ningún video con ese nombre.',
                quoted: m
            });
        }

        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=mp4&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;

        const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;

        if (!data || !data.success) {
            return await sock.sendMessage(from, {
                text: '❌ No se pudo procesar el video. Intenta con otro nombre.',
                quoted: m
            });
        }

        const cekProgress = async (id) => {
            while (true) {
                const res = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (res.data?.success && res.data.progress === 1000) {
                    return res.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 4000));
            }
        };

        const downloadUrl = await cekProgress(data.id);

        const caption = `
╭━━🎞️ *Video Descargado* 🎞️━━╮
┃ 🎬 *Título:* ${data.title}
┃ 👤 *Autor:* ${data.info?.author || 'Desconocido'}
┃ ⏱️ *Duración:* ${data.info?.duration || 'N/D'}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

💚 By ꧁𓊈🍃𝐊𝐚𝐫@𝐀𝐧𝐠𝐭🍃𓊉꧂
🇭🇳⃤⃤⃢™𝑯𝑬𝑹𝑵𝑨𝑵𝑩𝑬𝒁º⃤⃤
        `.trim();

        await sock.sendMessage(from, {
            text: caption,
        }, { quoted: m });

        await sock.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${data.title}.mp4`
        }, { quoted: m });

    } catch (error) {
        console.error('Error en .play2:', error);
        await sock.sendMessage(from, {
            text: '❌ Ocurrió un error al procesar el video.',
            quoted: m
        });
    }
};
