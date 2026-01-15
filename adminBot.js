const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const adminBot = new Client({
  authStrategy: new LocalAuth({
    clientId: "admin"
  }),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome',
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
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
