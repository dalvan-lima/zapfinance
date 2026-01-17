const db = require("./db");

/* =====================
   HELPERS
===================== */
function formatMoney(v = 0) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function capitalize(t = "") {
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* =====================
   DATE HELPERS
===================== */
function getDiasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

/* =====================
   HANDLE COMMAND
===================== */
function handleCommand(message) {
  if (!message) return null;

  const textoOriginal = message.trim();
  const texto = textoOriginal.toLowerCase();

  /* =====================
     INSTRUÇÕES
  ===================== */
  if (texto.startsWith("!instrucoes")) {
    return (
`🤖 *ZapFinance — Instruções de uso*

Todos os comandos seguem o padrão:
!comando/nome <valores>

📌 *Registrar gasto*
!gasto/joao 50 mercado

📌 *Registrar receita*
!receita/joao 2500 salario

📌 *Registrar gasto fixo*
!fixo/joao 1200 aluguel todo
!fixo/joao 300 curso parcelado 6

📌 *Definir limite mensal*
!limite/joao 2000

📌 *Definir meta de economia*
!meta/joao 800

📌 *Definir início do mês financeiro*
!iniciofinanceiro/joao 5

📌 *Ver resumo*
!resumo/joao

📌 *Previsão até fim do mês financeiro*
!previsao/joao

📌 *Fechar mês*
!fechar_mes/joao

━━━━━━━━━━━━━━
✏️ *Editar gasto*
!corrigir/joao
!corrigir/joao 2 valor 40
!corrigir/joao 2 categoria restaurante
!corrigir/joao 2 valor 40 categoria restaurante

🗑️ *Remover gasto*
!remover/joao
!remover/joao 2
`
    );
  }

  /* =====================
     PARSE COMANDO/NOME
  ===================== */
  const match = texto.match(/^!(\w+)\/(\w+)/);
  if (!match) return null;

  const comando = match[1];
  const nome = match[2];
  const partes = texto.split(" ").slice(1);

  /* =====================
     GASTO
  ===================== */
  if (comando === "gasto") {
    const valor = parseFloat(partes[0]);
    const categoria = partes.slice(1).join(" ") || "outros";

    if (isNaN(valor))
      return "⚠️ Use: !gasto/<nome> <valor> <categoria>";

    db.addGasto(nome, valor, categoria);

    let resposta = `✅ ${capitalize(nome)} gastou ${formatMoney(valor)} em ${capitalize(categoria)}.`;

    /* ===== LIMITE ===== */
    const limite = db.getLimite(nome);
    if (limite) {
      const total = db.getTotalGastos(nome);
      const pct = (total / limite) * 100;

      if (pct > 100)
        resposta += `\n🚨 Estourou o limite de ${formatMoney(limite)}!`;
      else if (pct > 80)
        resposta += `\n⚠️ Já usou ${pct.toFixed(1)}% do limite.`;
    }

    /* ===== META ===== */
    const meta = db.getMeta(nome);
    if (meta) {
      const receitas = db.getReceitas(nome);
      const gastos = db.getTotalGastos(nome);
      const saldo = receitas - gastos;

      if (saldo <= 0) {
        resposta += `\n🚨 Atenção: com esse gasto, não é mais possível atingir a meta de ${formatMoney(meta)}.`;
      } else {
        const pctMeta = (saldo / meta) * 100;
        resposta += `\n🎯 Meta: ${pctMeta.toFixed(1)}% ainda garantido.`;
      }
    }

    return resposta;
  }

  /* =====================
     RECEITA
  ===================== */
  if (comando === "receita") {
    const valor = parseFloat(partes[0]);
    const desc = partes.slice(1).join(" ");

    if (isNaN(valor))
      return "⚠️ Use: !receita/<nome> <valor> <descrição>";

    db.addReceita(nome, valor, desc);
    return `💰 ${capitalize(nome)} recebeu ${formatMoney(valor)}.`;
  }

  /* =====================
     FIXO
  ===================== */
  if (comando === "fixo") {
    const valor = parseFloat(partes[0]);
    const desc = partes[1];
    const tipo = partes[2];
    const meses = parseInt(partes[3]);

    if (isNaN(valor) || !desc || !tipo)
      return "⚠️ Use: !fixo/<nome> <valor> <desc> <todo|parcelado> [meses]";

    db.addFixo(nome, valor, desc, tipo, meses);
    return `📌 Fixo registrado para ${capitalize(nome)}.`;
  }

  /* =====================
     LIMITE
  ===================== */
  if (comando === "limite") {
    const valor = parseFloat(partes[0]);
    if (isNaN(valor)) return "⚠️ Use: !limite/<nome> <valor>";

    db.setLimite(nome, valor);
    return `📊 Limite de ${capitalize(nome)} definido em ${formatMoney(valor)}.`;
  }

  /* =====================
     META
  ===================== */
  if (comando === "meta") {
    const valor = parseFloat(partes[0]);
    if (isNaN(valor)) return "⚠️ Use: !meta/<nome> <valor>";

    db.setMeta(nome, valor);
    return `🎯 Meta de economia de ${capitalize(nome)} definida em ${formatMoney(valor)}.`;
  }

  /* =====================
     INÍCIO FINANCEIRO
  ===================== */
  if (comando === "iniciofinanceiro") {
    const dia = parseInt(partes[0]);

    if (isNaN(dia) || dia < 1 || dia > 28)
      return "⚠️ Use: !iniciofinanceiro/<nome> <dia> (1 a 28)";

    db.setInicioFinanceiro(nome, dia);
    return `📅 Mês financeiro de ${capitalize(nome)} definido para iniciar no dia ${dia}.`;
  }

  /* =====================
     PREVISÃO (MÊS FINANCEIRO)
  ===================== */
  if (comando === "previsao") {
    const inicio = db.getInicioFinanceiro(nome) || 1;

    const hoje = new Date();
    const diaHoje = hoje.getDate();
    let ano = hoje.getFullYear();
    let mes = hoje.getMonth();

    if (diaHoje < inicio) mes--;

    const inicioPeriodo = new Date(ano, mes, inicio);
    const fimPeriodo = new Date(ano, mes + 1, inicio - 1);

    const gastos = db.getGastosPeriodo(nome, inicioPeriodo, hoje);
    const diasDecorridos =
      Math.max(1, Math.ceil((hoje - inicioPeriodo) / (1000 * 60 * 60 * 24)));

    const media = gastos / diasDecorridos;
    const diasTotais =
      Math.ceil((fimPeriodo - inicioPeriodo) / (1000 * 60 * 60 * 24)) + 1;

    const previsao = media * diasTotais;

    return `📅 Previsão de ${capitalize(nome)}: ${formatMoney(previsao)} até o fim do mês financeiro.`;
  }

  /* =====================
     FECHAR MÊS
  ===================== */
  if (comando === "fechar_mes") {
    db.advanceMonth(nome);
    return `📆 Mês de ${capitalize(nome)} fechado. Parcelas atualizadas.`;
  }

  /* =====================
     CORRIGIR GASTO
  ===================== */
  if (comando === "corrigir") {
    const gastos = db.getUltimosGastos(nome, 5);

    if (!partes.length) {
      if (!gastos.length) return "⚠️ Nenhum gasto encontrado.";

      let txt = `📝 *Gastos recentes de ${capitalize(nome)}*\n\n`;
      gastos.forEach((g, i) => {
        txt += `${i + 1}) [${g.data}] ${capitalize(g.categoria)} - ${formatMoney(g.valor)}\n`;
      });

      txt += `\nUse:\n!corrigir/${nome} <número> valor <novo_valor>\n!corrigir/${nome} <número> categoria <nova_categoria>`;
      return txt;
    }

    const index = parseInt(partes[0]) - 1;
    const gasto = gastos[index];
    if (!gasto) return "⚠️ Número inválido.";

    let novoValor;
    let novaCategoria;

    for (let i = 1; i < partes.length; i++) {
      if (partes[i] === "valor") novoValor = parseFloat(partes[i + 1]);
      if (partes[i] === "categoria") novaCategoria = partes[i + 1];
    }

    db.updateGasto(gasto.id, {
      valor: isNaN(novoValor) ? undefined : novoValor,
      categoria: novaCategoria
    });

    return "✅ Gasto corrigido com sucesso.";
  }

  /* =====================
     REMOVER GASTO
  ===================== */
  if (comando === "remover") {
    const gastos = db.getUltimosGastos(nome, 5);

    if (!partes.length) {
      if (!gastos.length) return "⚠️ Nenhum gasto encontrado.";

      let txt = `🗑️ *Gastos recentes de ${capitalize(nome)}*\n\n`;
      gastos.forEach((g, i) => {
        txt += `${i + 1}) [${g.data}] ${capitalize(g.categoria)} - ${formatMoney(g.valor)}\n`;
      });

      txt += `\nUse:\n!remover/${nome} <número>`;
      return txt;
    }

    const index = parseInt(partes[0]) - 1;
    const gasto = gastos[index];
    if (!gasto) return "⚠️ Número inválido.";

    db.deleteGasto(gasto.id);
    return "🗑️ Gasto removido com sucesso.";
  }

  return null;
}

module.exports = { handleCommand };
