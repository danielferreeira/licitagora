const db = require('../config/database');
const { Pool } = require('pg');

class Licitacao {
  static async criar(dados) {
    const query = `
      INSERT INTO licitacoes (
        numero,
        cliente_id,
        orgao,
        objeto,
        modalidade,
        data_abertura,
        data_fim,
        valor_estimado,
        lucro_estimado,
        status,
        ramo_atividade,
        descricao,
        requisitos,
        observacoes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      dados.numero,
      dados.cliente_id,
      dados.orgao,
      dados.objeto,
      dados.modalidade,
      dados.data_abertura,
      dados.data_fim,
      dados.valor_estimado,
      dados.lucro_estimado,
      dados.status || 'Em Análise',
      dados.ramo_atividade,
      dados.descricao,
      dados.requisitos,
      dados.observacoes
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async listar(filtros = {}) {
    let query = `
      SELECT l.*, c.razao_social as cliente_nome
      FROM licitacoes l
      LEFT JOIN clientes c ON l.cliente_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filtros.cliente_id) {
      query += ` AND l.cliente_id = $${paramCount}`;
      values.push(filtros.cliente_id);
      paramCount++;
    }

    if (filtros.ramo_atividade) {
      query += ` AND l.ramo_atividade = $${paramCount}`;
      values.push(filtros.ramo_atividade);
      paramCount++;
    }

    if (filtros.modalidade) {
      query += ` AND l.modalidade = $${paramCount}`;
      values.push(filtros.modalidade);
      paramCount++;
    }

    if (filtros.data_inicio) {
      query += ` AND l.data_abertura >= $${paramCount}`;
      values.push(filtros.data_inicio);
      paramCount++;
    }

    if (filtros.data_fim) {
      query += ` AND l.data_abertura <= $${paramCount}`;
      values.push(filtros.data_fim);
      paramCount++;
    }

    if (filtros.valor_min) {
      query += ` AND l.valor_estimado >= $${paramCount}`;
      values.push(parseFloat(filtros.valor_min));
      paramCount++;
    }

    if (filtros.valor_max) {
      query += ` AND l.valor_estimado <= $${paramCount}`;
      values.push(parseFloat(filtros.valor_max));
      paramCount++;
    }

    // Ordenação padrão por data de abertura mais recente e depois por número
    query += ' ORDER BY l.data_abertura DESC, l.numero DESC';

    const result = await db.query(query, values);
    return result.rows;
  }

  static async buscarPorId(id) {
    const query = `
      SELECT l.*, c.razao_social as cliente_nome
      FROM licitacoes l
      LEFT JOIN clientes c ON l.cliente_id = c.id
      WHERE l.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async atualizar(id, dados) {
    const query = `
      UPDATE licitacoes
      SET 
        numero = $1,
        cliente_id = $2,
        orgao = $3,
        objeto = $4,
        modalidade = $5,
        data_abertura = $6,
        data_fim = $7,
        valor_estimado = $8,
        lucro_estimado = $9,
        status = $10,
        ramo_atividade = $11,
        descricao = $12,
        requisitos = $13,
        observacoes = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      dados.numero,
      dados.cliente_id,
      dados.orgao,
      dados.objeto,
      dados.modalidade,
      dados.data_abertura,
      dados.data_fim,
      dados.valor_estimado,
      dados.lucro_estimado,
      dados.status,
      dados.ramo_atividade,
      dados.descricao,
      dados.requisitos,
      dados.observacoes,
      id
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async excluir(id) {
    const query = 'DELETE FROM licitacoes WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async fecharLicitacao(id, dados) {
    try {
      // Verifica se a licitação existe e não está finalizada
      const resultVerificacao = await db.query(
        'SELECT status FROM licitacoes WHERE id = $1',
        [id]
      );

      const licitacao = resultVerificacao.rows[0];
      if (!licitacao) {
        return null;
      }

      if (licitacao.status === 'Finalizada') {
        throw new Error('Esta licitação já está finalizada');
      }

      // Atualiza os dados de fechamento
      const result = await db.query(
        `UPDATE licitacoes 
         SET valor_final = $1, 
             lucro_final = $2, 
             foi_ganha = $3, 
             motivo_perda = $4,
             data_fechamento = $5,
             status = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          dados.valor_final,
          dados.lucro_final,
          dados.foi_ganha,
          dados.motivo_perda,
          dados.data_fechamento,
          dados.status,
          id
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao fechar licitação:', error);
      throw error;
    }
  }
}

module.exports = Licitacao; 