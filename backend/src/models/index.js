const Licitacao = require('./Licitacao');
const Prazo = require('./Prazo');
const Cliente = require('./Cliente');

// Configurar relacionamentos com Prazo
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

// Inicializar as associações entre Cliente e Licitacao
const initializeAssociations = () => {
  if (Cliente.associate) {
    Cliente.associate({ Licitacao });
  }
  
  if (Licitacao.associate) {
    Licitacao.associate({ Cliente });
  }
};

// Executar a inicialização
initializeAssociations();

module.exports = {
  Licitacao,
  Prazo,
  Cliente,
}; 