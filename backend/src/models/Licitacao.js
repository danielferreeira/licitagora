const db = require('../config/db');

class Licitacao {
  static async criar(dados) {
    try {
      const {
        numero,
        orgao,
        objeto,
        data_abertura,
        valor_estimado,
        modalidade,
        status,
        ramos_atividade,
        edital_url,
        cliente_id
      } = dados;

      const query = `
        INSERT INTO licitacoes (
          numero,
          orgao,
          objeto,
          data_abertura,
          valor_estimado,
          modalidade,
          status,
          ramos_atividade,
          edital_url,
          cliente_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        numero,
        orgao,
        objeto,
        data_abertura,
        valor_estimado,
        modalidade,
        status,
        ramos_atividade,
        edital_url,
        cliente_id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async listar(filtros = {}) {
    try {
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

      if (filtros.status) {
        query += ` AND l.status = $${paramCount}`;
        values.push(filtros.status);
        paramCount++;
      }

      if (filtros.ramo_atividade) {
        query += ` AND $${paramCount} = ANY(l.ramos_atividade)`;
        values.push(filtros.ramo_atividade);
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

      if (filtros.modalidade) {
        query += ` AND l.modalidade ILIKE $${paramCount}`;
        values.push(`%${filtros.modalidade}%`);
        paramCount++;
      }

      query += ' ORDER BY l.data_abertura DESC';

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async buscarPorId(id) {
    try {
      const query = `
        SELECT l.*, c.razao_social as cliente_nome
        FROM licitacoes l
        LEFT JOIN clientes c ON l.cliente_id = c.id
        WHERE l.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async atualizar(id, dados) {
    try {
      const campos = [];
      const values = [];
      let paramCount = 1;

      Object.keys(dados).forEach(key => {
        if (dados[key] !== undefined) {
          campos.push(`${key} = $${paramCount}`);
          values.push(dados[key]);
          paramCount++;
        }
      });

      values.push(id);

      const query = `
        UPDATE licitacoes
        SET ${campos.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async excluir(id) {
    try {
      const query = 'DELETE FROM licitacoes WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
} 