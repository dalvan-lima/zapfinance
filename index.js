const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const adminBot = require('./adminBot');
const { handleCommand } = require('./handleCommand');

const ADMIN_NUMBER = "5511949933721@c.us"; // coloque seu número aqui

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "zapbot"
  }),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome',
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

/* QR CODE */
client.on('qr', async qr => {
  console.log("⚠️ ZapBot precisa de QR");

  qrcodeTerminal.generate(qr, { small: true });

  try {
    const img = await qrcode.toDataURL(qr);
    const media = MessageMedia.fromDataURL(img);

    await adminBot.sendMessage(ADMIN_NUMBER, media);
    await adminBot.sendMessage(ADMIN_NUMBER, "⚠️ ZapBot desconectado. Escaneie este QR para religar.");
  } catch (err) {
    console.log("Erro ao enviar QR para admin:", err.message);
  }
});

/* PRONTO */
client.on('ready', () => {
  console.log("✅ ZapBot online");
});

/* DESCONECTADO */
client.on('disconnected', reason => {
  console.log("⚠️ ZapBot desconectado:", reason);
});

/* MENSAGENS */
client.on('message_create', async message => {
  try {
    // Evita loop: ignora mensagens que o bot enviou
    if (message.fromMe && message.isStatus === false && message.hasQuotedMsg === false) {
      return;
    }

    const resposta = handleCommand(message);
    if (resposta) {
      await message.reply(resposta);
    }
  } catch (err) {
    console.log("Erro ao processar mensagem:", err.message);
  }
});

client.initialize();
