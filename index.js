const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const adminBot = require('./adminBot');
const { handleCommand } = require('./handleCommand');

const ADMIN_NUMBER = "5511949933721@c.us"; // seu número

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "zapbot"
  }),
  puppeteer: {
    executablePath: "/usr/bin/google-chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  }
});

/* ================= QR ================= */
client.on("qr", async qr => {
  console.log("⚠️ ZapBot precisa de QR");

  // QR no terminal
  qrcodeTerminal.generate(qr, { small: true });

  try {
    // QR em imagem
    const img = await qrcode.toDataURL(qr);
    const base64 = img.replace(/^data:image\/png;base64,/, "");
    const media = MessageMedia.fromBase64(base64, "image/png", "qrcode.png");

    // Enviar QR no WhatsApp
    await adminBot.sendMessage(ADMIN_NUMBER, media);
    await adminBot.sendMessage(
      ADMIN_NUMBER,
      "⚠️ ZapBot desconectado. Escaneie este QR para reconectar."
    );
  } catch (err) {
    console.error("Erro ao enviar QR para admin:", err.message);
  }
});

/* ================= READY ================= */
client.on("ready", () => {
  console.log("✅ ZapBot online e conectado");
});

/* ================= DISCONNECTED ================= */
client.on("disconnected", reason => {
  console.log("⚠️ ZapBot desconectado:", reason);
});

/* ================= MESSAGES ================= */
client.on("message_create", async message => {
  try {
    // Evita loop: ignora mensagens enviadas pelo próprio bot
    if (message.fromMe) return;

    const resposta = handleCommand(message);
    if (resposta) {
      await message.reply(resposta);
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
  }
});

/* ================= START ================= */
client.initialize();
