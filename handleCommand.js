const db = require("./db");

function formatMoney(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function capitalize(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function handleCommand(message) {
  const texto = message.body.toLowerCase().trim();

  const match = texto.match(/^!(\w+)\/(\w+)/);
  if (!match) return null;

  const comando = match[1];
  const nome = match[2];
  const partes = texto.split(" ").slice(1);

  if (comando === "gasto") {
    const valor = parseFloat(partes[0]);
    const categoria = partes.slice(1).join(" ") || "outros";

    if (isNaN(valor)) return "⚠️ Use: !gasto/<nome> <valor> <categoria>";

    db.addGasto(nome, valor, categoria);

    let resposta = `✅ ${capitalize(nome)} gastou ${formatMoney(valor)} em ${capitalize(categoria)}.`;

    const limite = db.getLimite(nome);
    if (limite) {
      const total = db.getTotalGastos(nome);
      const pct = (total / limite) * 100;
      if (pct > 100) resposta += `\n🚨 Estourou o limite de ${formatMoney(limite)}!`;
      else if (pct > 80) resposta += `\n⚠️ Já usou ${pct.toFixed(1)}% do limite.`;
    }

    return resposta;
  }

  if (comando === "receita") {
    const valor = parseFloat(partes[0]);
    const desc = partes.slice(1).join(" ");

    if (isNaN(valor)) return "⚠️ Use: !receita/<nome> <valor> <descrição>";

    db.addReceita(nome, valor, desc);
    return `💰 ${capitalize(nome)} recebeu ${formatMoney(valor)}.`;
  }

  if (comando === "fixo") {
    const valor = parseFloat(partes[0]);
    const desc = partes[1];
    const tipo = partes[2];
    const meses = parseInt(partes[3]);

    if (isNaN(valor) || !desc || !tipo) return "⚠️ Use: !fixo/<nome> <valor> <desc> <todo|parcelado> [meses]";

    db.addFixo(nome, valor, desc, tipo, meses);
    return `📌 Fixo registrado para ${capitalize(nome)}.`;
  }

  if (comando === "limite") {
    const valor = parseFloat(partes[0]);
    db.setLimite(nome, valor);
    return `📊 Limite de ${capitalize(nome)} definido em ${formatMoney(valor)}.`;
  }

  if (comando === "meta") {
    const valor = parseFloat(partes[0]);
    db.setMeta(nome, valor);
    return `🎯 Meta de economia de ${capitalize(nome)} definida em ${formatMoney(valor)}.`;
  }

  if (comando === "resumo") {
    const { gastos, receitas, fixos } = db.getResumo(nome);
    const totalGastos = db.getTotalGastos(nome);
    const meta = db.getMeta(nome);

    let txt = `📊 Resumo de ${capitalize(nome)}\n`;
    gastos.forEach(g => txt += `• ${capitalize(g.categoria)}: ${formatMoney(g.total)}\n`);
    txt += `\n💸 Gastos totais: ${formatMoney(totalGastos)}\n`;
    txt += `💰 Receitas: ${formatMoney(receitas)}\n`;

    const saldo = receitas - totalGastos;
    txt += `📈 Saldo: ${formatMoney(saldo)}\n`;

    if (meta) {
      const pct = (saldo / meta) * 100;
      txt += `🎯 Meta: ${pct.toFixed(1)}% atingido`;
    }

    return txt;
  }

  if (comando === "previsao") {
    const gastos = db.getTotalGastos(nome);
    const dias = new Date().getDate();
    const media = gastos / dias;
    const prev = media * 30;

    return `📅 Previsão de ${capitalize(nome)}: ${formatMoney(prev)} até o fim do mês.`;
  }

  if (comando === "fechar_mes") {
    db.advanceMonth(nome);
    return `📆 Mês de ${capitalize(nome)} fechado. Parcelas atualizadas.`;
  }

    if (comando === "instrucoes") {
    return (
        `🤖 *ZapFinance — Instruções de uso*

        Todos os comandos seguem o padrão:
        !comando/nome <valores>

        📌 *Registrar gasto*
        !gasto/joao 50 mercado  
        → João gastou R$50 em mercado

        📌 *Registrar receita*
        !receita/joao 2500 salario

        📌 *Registrar gasto fixo*
        !fixo/joao 1200 aluguel todo  
        !fixo/joao 300 curso parcelado 6  

        📌 *Definir limite mensal*
        !limite/joao 2000  

        📌 *Definir meta de economia*
        !meta/joao 800  

        📌 *Ver resumo*
        !resumo/joao  

        📌 *Previsão até fim do mês*
        !previsao/joao  

        📌 *Fechar mês*
        !fechar_mes/joao  

        ━━━━━━━━━━━━━━  
        💡 *Dica:*  
        Categorias podem ser qualquer coisa: mercado, ifood, lazer, aluguel, etc.
        O sistema soma tudo automaticamente.
        `
    );
  }


  return null;
}

module.exports = { handleCommand };
