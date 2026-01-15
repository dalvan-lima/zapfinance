const Database = require("better-sqlite3");
const db = new Database("zapbot.db");

db.exec(`
CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  valor REAL,
  categoria TEXT,
  data TEXT
);

CREATE TABLE IF NOT EXISTS receitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  valor REAL,
  descricao TEXT,
  data TEXT
);

CREATE TABLE IF NOT EXISTS fixos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  valor REAL,
  descricao TEXT,
  tipo TEXT,
  meses_restantes INTEGER
);

CREATE TABLE IF NOT EXISTS limites (
  nome TEXT PRIMARY KEY,
  valor REAL
);

CREATE TABLE IF NOT EXISTS metas (
  nome TEXT PRIMARY KEY,
  valor REAL
);
`);

function addGasto(nome, valor, categoria) {
  db.prepare("INSERT INTO gastos (nome, valor, categoria, data) VALUES (?, ?, ?, date('now'))")
    .run(nome, valor, categoria);
}

function addReceita(nome, valor, descricao) {
  db.prepare("INSERT INTO receitas (nome, valor, descricao, data) VALUES (?, ?, ?, date('now'))")
    .run(nome, valor, descricao);
}

function addFixo(nome, valor, descricao, tipo, meses) {
  db.prepare("INSERT INTO fixos (nome, valor, descricao, tipo, meses_restantes) VALUES (?, ?, ?, ?, ?)")
    .run(nome, valor, descricao, tipo, meses || null);
}

function setLimite(nome, valor) {
  db.prepare("INSERT INTO limites (nome, valor) VALUES (?, ?) ON CONFLICT(nome) DO UPDATE SET valor = excluded.valor")
    .run(nome, valor);
}

function setMeta(nome, valor) {
  db.prepare("INSERT INTO metas (nome, valor) VALUES (?, ?) ON CONFLICT(nome) DO UPDATE SET valor = excluded.valor")
    .run(nome, valor);
}

function getResumo(nome) {
  const gastos = db.prepare("SELECT categoria, SUM(valor) total FROM gastos WHERE nome=? GROUP BY categoria").all(nome);
  const receitas = db.prepare("SELECT SUM(valor) total FROM receitas WHERE nome=?").get(nome)?.total || 0;
  const fixos = db.prepare("SELECT SUM(valor) total FROM fixos WHERE nome=?").get(nome)?.total || 0;

  return { gastos, receitas, fixos };
}

function getTotalGastos(nome) {
  const variavel = db.prepare("SELECT SUM(valor) total FROM gastos WHERE nome=?").get(nome)?.total || 0;
  const fixos = db.prepare("SELECT SUM(valor) total FROM fixos WHERE nome=?").get(nome)?.total || 0;
  return variavel + fixos;
}

function getLimite(nome) {
  return db.prepare("SELECT valor FROM limites WHERE nome=?").get(nome)?.valor;
}

function getMeta(nome) {
  return db.prepare("SELECT valor FROM metas WHERE nome=?").get(nome)?.valor;
}

function getReceitas(nome) {
  return db.prepare("SELECT SUM(valor) total FROM receitas WHERE nome=?").get(nome)?.total || 0;
}

function advanceMonth(nome) {
  db.prepare("UPDATE fixos SET meses_restantes = meses_restantes - 1 WHERE nome=? AND tipo='parcelado'").run(nome);
  db.prepare("DELETE FROM fixos WHERE nome=? AND tipo='parcelado' AND meses_restantes <= 0").run(nome);
}

module.exports = {
  addGasto,
  addReceita,
  addFixo,
  setLimite,
  setMeta,
  getResumo,
  getTotalGastos,
  getLimite,
  getMeta,
  getReceitas,
  advanceMonth
};
