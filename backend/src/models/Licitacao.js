const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Licitacao = sequelize.define('Licitacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id',
    },
  },
  orgao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  objeto: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  modalidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_abertura: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  valor_estimado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('valor_estimado');
      return value === null ? null : Number(value);
    }
  },
  lucro_estimado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('lucro_estimado');
      return value === null ? null : Number(value);
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Em Análise',
  },
  ramo_atividade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requisitos: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  valor_final: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('valor_final');
      return value === null ? null : Number(value);
    }
  },
  lucro_final: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('lucro_final');
      return value === null ? null : Number(value);
    }
  },
  foi_ganha: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  motivo_perda: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  data_fechamento: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'licitacoes',
  timestamps: true,
  underscored: true,
});

// Adicionar associação com Cliente
Licitacao.associate = (models) => {
  Licitacao.belongsTo(models.Cliente, {
    foreignKey: 'cliente_id',
    as: 'cliente',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
};

// Adicionar métodos estáticos
Licitacao.buscarPorId = async function(id) {
  return await this.findByPk(id, {
    include: [{
      model: require('./Cliente'),
      as: 'cliente',
      attributes: ['razao_social', 'cnpj']
    }]
  });
};

// Método para fechar uma licitação
Licitacao.fecharLicitacao = async function(id, dados) {
  const licitacao = await this.findByPk(id);
  
  if (!licitacao) {
    return null;
  }

  if (licitacao.status === 'Finalizada') {
    throw new Error('Esta licitação já está finalizada');
  }

  // Atualizar os dados da licitação
  await licitacao.update({
    valor_final: dados.valor_final,
    lucro_final: dados.lucro_final,
    foi_ganha: dados.foi_ganha,
    motivo_perda: dados.motivo_perda,
    data_fechamento: dados.data_fechamento,
    status: dados.status
  });

  // Buscar a licitação atualizada com as informações do cliente
  return await this.buscarPorId(id);
};

// Método para atualizar uma licitação
Licitacao.atualizar = async function(id, dados) {
  const licitacao = await this.findByPk(id);
  
  if (!licitacao) {
    return null;
  }

  // Atualizar os dados da licitação
  await licitacao.update(dados);

  // Buscar a licitação atualizada com as informações do cliente
  return await this.buscarPorId(id);
};

// Método para criar uma licitação
Licitacao.criar = async function(dados) {
  return await this.create(dados);
};

module.exports = Licitacao; 