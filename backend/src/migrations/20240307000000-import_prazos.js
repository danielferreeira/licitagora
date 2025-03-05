module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Buscar todas as licitações em andamento
      const licitacoes = await queryInterface.sequelize.query(
        `SELECT id, numero, orgao, data_fim 
         FROM licitacoes 
         WHERE status = 'Em Andamento' AND data_fim IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Criar prazos para cada licitação
      const prazos = licitacoes.map(licitacao => ({
        titulo: `Encerramento da Licitação: ${licitacao.numero} - ${licitacao.orgao}`,
        data_prazo: licitacao.data_fim,
        observacoes: 'Prazo importado automaticamente da data de encerramento da licitação.',
        licitacao_id: licitacao.id,
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Inserir os prazos
      if (prazos.length > 0) {
        await queryInterface.bulkInsert('prazos', prazos);
      }
    } catch (error) {
      console.error('Erro ao importar prazos:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remover apenas os prazos que foram importados automaticamente
      await queryInterface.bulkDelete('prazos', {
        observacoes: 'Prazo importado automaticamente da data de encerramento da licitação.'
      });
    } catch (error) {
      console.error('Erro ao reverter importação de prazos:', error);
      throw error;
    }
  }
}; 