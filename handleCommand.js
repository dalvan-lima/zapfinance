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

📌 *Ver resumo*
!resumo/joao

📌 *Previsão até fim do mês*
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

💡 *Dica:*  
Os números mostrados são apenas para escolha visual.
O sistema usa ID interno com segurança.
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

    return `✅ ${capitalize(nome)} gastou ${formatMoney(valor)} em ${capitalize(categoria)}.`;
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

      txt += `
\nUse:
!corrigir/${nome} <número> valor <novo_valor>
!corrigir/${nome} <número> categoria <nova_categoria>
!corrigir/${nome} <número> valor <novo_valor> categoria <nova_categoria>
`;
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

    if (novoValor === undefined && !novaCategoria)
      return "⚠️ Nada para corrigir.";

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
