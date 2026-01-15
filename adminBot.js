const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const adminBot = new Client({
  authStrategy: new LocalAuth({
    clientId: "admin"
  }),
  puppeteer: {
    webCache: {
    type: "none"
  },
  executablePath: '/usr/bin/chromium-browser',
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-zygote",
    "--single-process"
  ]
}
});

/* QR do Admin */
adminBot.on('qr', qr => {
  console.log("📲 Escaneie o QR do AdminBot");
  qrcode.generate(qr, { small: true });
});

/* Pronto */
adminBot.on('ready', () => {
  console.log("🛡️ AdminBot online");
});

adminBot.on('disconnected', reason => {
  console.log("⚠️ AdminBot desconectado:", reason);
});

adminBot.initialize();

module.exports = adminBot;
