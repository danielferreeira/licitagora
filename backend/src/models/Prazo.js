const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prazo = sequelize.define('Prazo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_prazo: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  licitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'licitacoes',
      key: 'id',
    },
  },
}, {
  tableName: 'prazos',
  timestamps: true,
  underscored: true,
});

module.exports = Prazo; 