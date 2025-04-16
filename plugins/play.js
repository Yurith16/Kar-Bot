const axios = require('axios');

module.exports = async function play(sock, m, text, from) {
    try {
        const query = text.split('.play ')[1];
        if (!query) return await sock.sendMessage(from, {
            text: '❌ Escribe el nombre de una canción para buscar.\n\n📝 Ejemplo: *.play Shakira Acrostico*',
            quoted: m
        });

        await sock.sendMessage(from, {
            text: `╭━━🎧 *𝐊𝐚𝐫𝐁𝐨𝐭 - Descargando...* 🎧━━╮\n┃ 🔍 _${query}_\n┃ ⏳ *Espérame tantito...*\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
            quoted: m
        });

        const format = 'mp3';
        const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${query}`)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;

        const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;

        if (!data || !data.success) {
            return await sock.sendMessage(from, {
                text: '❌ No se pudo obtener el audio. Intenta con otro nombre.',
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
╭━━🔊 *En un momento envío tu musica* 🔊━━╮
┃ 🎵 *Título:* ${data.title}
┃ 👤 *Autor:* ${data.info?.author || 'Desconocido'}
┃ ⏱️ *Duración:* ${data.info?.duration || 'N/D'}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📥 *Disfruta y comparte...*

💚 By ꧁𓊈🍃𝐊𝐚𝐫@𝐀𝐧𝐠𝐭🍃𓊉꧂
🇭🇳⃤⃤⃢🍃™𝑯𝑬𝑹𝑵𝑨𝑵𝑩𝑬𝒁º⃤⃤
        `.trim();

        await sock.sendMessage(from, {
            text: caption,
            quoted: m
        });

        await sock.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            ptt: false // Cambiar a true si querés que se escuche como nota de voz
        }, { quoted: m });

    } catch (error) {
        console.error('Error en .play:', error);
        await sock.sendMessage(from, {
            text: '❌ Ocurrió un error al procesar la canción.',
            quoted: m
        });
    }
};
