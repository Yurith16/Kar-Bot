const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { writeFileSync, unlinkSync } = require('fs');
const path = require('path');
const { fromBuffer } = require('file-type');
const { spawn } = require('child_process');
const tmp = require('tmp');

module.exports.run = async (sock, m) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = m.message?.imageMessage || quoted?.imageMessage;

        if (!isImage) {
            return await sock.sendMessage(m.key.remoteJid, { text: '❌ Debes enviar o responder a una imagen para convertirla en sticker.' }, { quoted: m });
        }

        const messageContent = m.message.imageMessage
            ? m
            : { message: { imageMessage: quoted.imageMessage }, key: { remoteJid: m.key.remoteJid } };

        const buffer = await downloadMediaMessage(messageContent, 'buffer', {}, { logger: console });

        const type = await fromBuffer(buffer);
        if (!type || !['image/jpeg', 'image/png'].includes(type.mime)) {
            return await sock.sendMessage(m.key.remoteJid, { text: '❌ El archivo no es una imagen válida.' }, { quoted: m });
        }

        // Crear archivo temporal
        const tmpFile = tmp.tmpNameSync({ postfix: `.${type.ext}` });
        writeFileSync(tmpFile, buffer);

        const outputSticker = tmpFile.replace(/\.[a-z]+$/, '.webp');

        // Convertir con ffmpeg
        await new Promise((resolve, reject) => {
            const ff = spawn('ffmpeg', [
                '-i', tmpFile,
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
                '-loop', '0',
                '-ss', '00:00:00.0',
                '-t', '10',
                '-preset', 'default',
                '-an', '-vsync', '0',
                outputSticker
            ]);

            ff.on('close', (code) => {
                if (code !== 0) return reject(new Error('ffmpeg failed'));
                resolve();
            });
        });

        // Enviar sticker como documento webp
        const stickerBuffer = require('fs').readFileSync(outputSticker);

        await sock.sendMessage(m.key.remoteJid, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        }, { quoted: m });

        // Limpiar archivos
        unlinkSync(tmpFile);
        unlinkSync(outputSticker);

    } catch (error) {
        console.error('❌ Error al generar sticker:', error);
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Ocurrió un error al generar el sticker.' }, { quoted: m });
    }
};
