module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('prazos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      data_prazo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      licitacao_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'licitacoes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('prazos');
  }
}; 