const play = require('./plugins/play');
const play2 = require('./plugins/play2');
const menu = require('./plugins/menu');
//const sticker = require('./plugins/sticker');


const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// 1. Configuración mejorada para Windows
const authFolder = path.join(__dirname, 'auth_info');

async function startBot() {
    try {
        // 2. Inicialización correcta del estado de autenticación
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        
        const { version } = await fetchLatestBaileysVersion();
        console.log(`Conectando con Baileys v${version.join('.')}`);

        // 3. Configuración del socket con todos los parámetros requeridos
        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: state.keys
            },
            version: version,
            browser: ['Karbot', 'Chrome', '1.0.0']
        });

        // 4. Manejo de eventos mejorado
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) console.log('📲 Escanea este QR con WhatsApp:');
            
            if (connection === 'open') {
                console.log('✅ Conexión exitosa como:', state.creds.me?.id || 'Nuevo dispositivo');
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('⏳ Reconectando...');
                if (shouldReconnect) await startBot();
            }
        });

        // 5. Manejo básico de mensajes
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const m = messages[0];
            if (!m.message || m.key.fromMe) return;
        
            const from = m.key.remoteJid;
            const text = m.message.conversation || m.message.extendedTextMessage?.text || '';

            if (text.startsWith('.play ')) return await play(sock, m, text, from);
            if (text.startsWith('.play2 ')) return await play2(sock, m, text, from);
            if (text === '.menu') return await menu(sock, m, text, from);
            if (text.startsWith('.s')) return await sticker.run(sock, m);
            if (text.startsWith('.s')) return await sticker.run(sock, m);

        });

    } catch (err) {
        console.error('❌ ERROR CRÍTICO:', err);
        process.exit(1);
    }
}

// 6. Verificación y creación de directorio
if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
    console.log('📁 Directorio de autenticación creado');
}

// 7. Inicio seguro
console.log('🚀 Iniciando bot...');
startBot();
