const Licitacao = require('./Licitacao');
const Prazo = require('./Prazo');
const Cliente = require('./Cliente');

// Configurar relacionamentos
Licitacao.hasMany(Prazo, {
  foreignKey: 'licitacao_id',
  as: 'prazos',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Prazo.belongsTo(Licitacao, {
  foreignKey: 'licitacao_id',
  as: 'licitacao',
});

// Relacionamento com Cliente
Licitacao.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente',
});

Cliente.hasMany(Licitacao, {
  foreignKey: 'cliente_id',
  as: 'licitacoes',
});

module.exports = {
  Licitacao,
  Prazo,
  Cliente,
}; 