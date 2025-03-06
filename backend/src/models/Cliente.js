const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  razao_social: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cnpj: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ramos_atividade: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
}, {
  tableName: 'clientes',
  timestamps: true,
  underscored: true,
});

// Adicionar associação com Licitacao
Cliente.associate = (models) => {
  Cliente.hasMany(models.Licitacao, {
    foreignKey: 'cliente_id',
    as: 'licitacoes',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
};

module.exports = Cliente; 