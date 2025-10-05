const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const logger = require('./src/utils/logger');
const qrcode = require('qrcode-terminal');

async function testWA() {
  console.log('Testing Baileys with Hybrid Logger...');

  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();

  console.log('Baileys version:', version);

  // 🔥 Gunakan Pino jika available, fallback ke Winston
  const baileysLogger = logger.getPino() || logger;

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: baileysLogger,
  });

  sock.ev.on('connection.update', (update) => {
    console.log('Connection update:', update);
    if (update.qr) {
      qrcode.generate(update.qr, { small: true });
      logger.info('QR code received and displayed in terminal');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  console.log('✅ WhatsApp initialized');
}

testWA().catch(console.error);