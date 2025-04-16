module.exports = async (sock, m, text, from) => {
    const menuText = `
╭───〔 *📜 MENÚ DE COMANDOS* 〕───⬣
│
├ .play [nombre de canción]
├ .play2 [nombre del video]
├ .menu (muestra este menú)
├ .s (responde a una imagen para crear un stickers)
│
╰───────────────⬣
*By ꧁𓊈🍃𝐊𝐚𝐫@𝐀𝐧𝐠𝐭🍃𓊉꧂*
    `;
    await sock.sendMessage(from, { text: menuText.trim() }, { quoted: m });
};
