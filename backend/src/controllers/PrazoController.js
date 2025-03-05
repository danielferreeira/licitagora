const { pool } = require('../config/database');

class PrazoController {
  async index(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          p.*,
          l.numero as licitacao_numero,
          l.orgao as licitacao_orgao,
          l.data_fim as licitacao_data_fim
        FROM prazos p
        LEFT JOIN licitacoes l ON p.licitacao_id = l.id
        ORDER BY p.data_prazo ASC
      `);

      // Formatar as datas para ISO string
      const prazos = result.rows.map(prazo => ({
        ...prazo,
        data_prazo: prazo.data_prazo ? prazo.data_prazo.toISOString() : null,
        licitacao_data_fim: prazo.licitacao_data_fim ? prazo.licitacao_data_fim.toISOString() : null,
        created_at: prazo.created_at ? prazo.created_at.toISOString() : null,
        updated_at: prazo.updated_at ? prazo.updated_at.toISOString() : null
      }));

      return res.json(prazos);
    } catch (error) {
      console.error('Erro ao listar prazos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const { titulo, data_prazo, observacoes, licitacao_id } = req.body;

      if (!titulo || !data_prazo) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
      }

      // Verificar se a licitação existe
      if (licitacao_id) {
        const licitacao = await pool.query('SELECT id FROM licitacoes WHERE id = $1', [licitacao_id]);
        if (licitacao.rowCount === 0) {
          return res.status(400).json({ error: 'Licitação não encontrada' });
        }
      }

      // Converter a data para o formato do PostgreSQL
      const dataPrazoFormatada = new Date(data_prazo);
      if (isNaN(dataPrazoFormatada.getTime())) {
        return res.status(400).json({ error: 'Data inválida' });
      }

      const result = await pool.query(
        `INSERT INTO prazos (titulo, data_prazo, observacoes, licitacao_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [titulo, dataPrazoFormatada, observacoes, licitacao_id]
      );

      // Buscar informações da licitação se existir
      if (licitacao_id) {
        const licitacaoInfo = await pool.query(
          'SELECT numero, orgao FROM licitacoes WHERE id = $1',
          [licitacao_id]
        );
        if (licitacaoInfo.rowCount > 0) {
          result.rows[0].licitacao_numero = licitacaoInfo.rows[0].numero;
          result.rows[0].licitacao_orgao = licitacaoInfo.rows[0].orgao;
        }
      }

      // Formatar as datas
      const prazo = {
        ...result.rows[0],
        data_prazo: result.rows[0].data_prazo ? result.rows[0].data_prazo.toISOString() : null,
        created_at: result.rows[0].created_at ? result.rows[0].created_at.toISOString() : null,
        updated_at: result.rows[0].updated_at ? result.rows[0].updated_at.toISOString() : null
      };

      return res.status(201).json(prazo);
    } catch (error) {
      console.error('Erro ao criar prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, data_prazo, observacoes, licitacao_id } = req.body;

      // Verificar se o prazo existe
      const prazoExistente = await pool.query('SELECT id FROM prazos WHERE id = $1', [id]);
      if (prazoExistente.rowCount === 0) {
        return res.status(404).json({ error: 'Prazo não encontrado' });
      }

      // Verificar se a licitação existe
      if (licitacao_id) {
        const licitacao = await pool.query('SELECT id FROM licitacoes WHERE id = $1', [licitacao_id]);
        if (licitacao.rowCount === 0) {
          return res.status(400).json({ error: 'Licitação não encontrada' });
        }
      }

      // Converter a data para o formato do PostgreSQL
      const dataPrazoFormatada = new Date(data_prazo);
      if (isNaN(dataPrazoFormatada.getTime())) {
        return res.status(400).json({ error: 'Data inválida' });
      }

      const result = await pool.query(
        `UPDATE prazos
         SET titulo = $1, data_prazo = $2, observacoes = $3, licitacao_id = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [titulo, dataPrazoFormatada, observacoes, licitacao_id, id]
      );

      // Buscar informações da licitação se existir
      if (licitacao_id) {
        const licitacaoInfo = await pool.query(
          'SELECT numero, orgao FROM licitacoes WHERE id = $1',
          [licitacao_id]
        );
        if (licitacaoInfo.rowCount > 0) {
          result.rows[0].licitacao_numero = licitacaoInfo.rows[0].numero;
          result.rows[0].licitacao_orgao = licitacaoInfo.rows[0].orgao;
        }
      }

      // Formatar as datas
      const prazo = {
        ...result.rows[0],
        data_prazo: result.rows[0].data_prazo ? result.rows[0].data_prazo.toISOString() : null,
        created_at: result.rows[0].created_at ? result.rows[0].created_at.toISOString() : null,
        updated_at: result.rows[0].updated_at ? result.rows[0].updated_at.toISOString() : null
      };

      return res.json(prazo);
    } catch (error) {
      console.error('Erro ao atualizar prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM prazos WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Prazo não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }

  async importarPrazosLicitacoes(req, res) {
    try {
      // Buscar todas as licitações em andamento
      const licitacoesResult = await pool.query(`
        SELECT id, numero, orgao, data_fim 
        FROM licitacoes 
        WHERE status = 'Em Andamento' AND data_fim IS NOT NULL
      `);

      const licitacoes = licitacoesResult.rows;
      let prazosImportados = 0;

      // Criar prazos para cada licitação
      for (const licitacao of licitacoes) {
        // Verificar se já existe um prazo para esta licitação
        const prazoExistente = await pool.query(
          `SELECT id FROM prazos WHERE licitacao_id = $1 AND observacoes = $2`,
          [licitacao.id, 'Prazo importado automaticamente da data de encerramento da licitação.']
        );

        if (prazoExistente.rowCount === 0) {
          // Inserir novo prazo
          await pool.query(
            `INSERT INTO prazos (titulo, data_prazo, observacoes, licitacao_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              `Encerramento da Licitação: ${licitacao.numero} - ${licitacao.orgao}`,
              licitacao.data_fim,
              'Prazo importado automaticamente da data de encerramento da licitação.',
              licitacao.id
            ]
          );
          prazosImportados++;
        }
      }

      return res.json({ 
        message: `Importação concluída com sucesso. ${prazosImportados} prazos importados.`,
        prazosImportados 
      });
    } catch (error) {
      console.error('Erro ao importar prazos:', error);
      return res.status(500).json({ error: 'Erro ao importar prazos: ' + error.message });
    }
  }
}

module.exports = new PrazoController(); 