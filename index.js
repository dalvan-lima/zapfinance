const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { handleCommand } = require('./handleCommand');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "zapbot"
  }),
  headless: false,
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1031490220-alpha.html`,
  },
  puppeteer: {
    // executablePath: '/usr/bin/google-chrome',
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

/* QR CODE */
/* QR CODE */
client.on('qr', async qr => {
  console.log("⚠️ ZapBot precisa de QR");

  qrcodeTerminal.generate(qr, { small: true });

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
// client.on('message_create', async message => {
//   try {
//     Evita loop: ignora mensagens que o bot enviou
//     if (message.fromMe && message.isStatus === false && message.hasQuotedMsg === false) {
//       return;
//     }
//     console.log(message)
//     const resposta = handleCommand(message);
//     if (resposta) {
//       await message.reply(resposta);
//     }
//   } catch (err) {
//     console.log("Erro ao processar mensagem:", err.message);
//   }
// });

// client.on("message_create", async _message => {
//   try {
//     const message = await _message;
//     // ignora mensagens que NÃO são comandos
//     if (!message.body || !message.body.startsWith("!")) return;

//     // evita loop (mensagens do próprio bot sem comando)
//     if (message.fromMe && !message.body.startsWith("!")) return;

//     const resposta = handleCommand(message.body);

//     console.log(message.body, resposta)
//     await message.reply(`[BOT] ${resposta}`);
//   } catch (err) {
//     console.error("Erro ao processar mensagem:", err.message);
//   }
// });

client.on("message_create", async message => {
  try {
    if (message.from.includes('5511949933721') && message.body.startsWith('[BOT]')) return;
    if (!message.from.includes('5511949933721') && !message.from.includes('5515997056973')) return;
    if (!message.body?.startsWith("!")) return;

    const resposta = handleCommand(message.body);
    if (!resposta) return;

    // 🚫 NÃO responder no mesmo chat
    try {
      await message.reply(`[BOT] ${resposta}`);
    } catch (err) {
      console.error("Erro ao responder:", err.message);
    }

  } catch (e) {
    console.error("Erro:", e);
  }
});

client.initialize();
