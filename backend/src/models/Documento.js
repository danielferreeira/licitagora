const db = require('../config/database');

class Documento {
  // Documentos do Cliente
  static async listarTiposDocumentosCliente() {
    const query = 'SELECT * FROM tipos_documentos_cliente ORDER BY nome';
    const result = await db.query(query);
    return result.rows;
  }

  static async listarDocumentosCliente(clienteId) {
    const query = `
      SELECT 
        dc.*,
        tdc.nome as tipo_documento_nome,
        tdc.descricao as tipo_documento_descricao,
        tdc.obrigatorio as tipo_documento_obrigatorio
      FROM documentos_cliente dc
      JOIN tipos_documentos_cliente tdc ON dc.tipo_documento_id = tdc.id
      WHERE dc.cliente_id = $1
      ORDER BY dc.created_at DESC
    `;
    const result = await db.query(query, [clienteId]);
    return result.rows;
  }

  static async salvarDocumentoCliente(dados) {
    const query = `
      INSERT INTO documentos_cliente (
        cliente_id,
        tipo_documento_id,
        nome_arquivo,
        caminho_arquivo,
        data_validade,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      dados.cliente_id,
      dados.tipo_documento_id,
      dados.nome_arquivo,
      dados.caminho_arquivo,
      dados.data_validade,
      dados.observacoes
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async excluirDocumentoCliente(id) {
    const query = 'DELETE FROM documentos_cliente WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Documentos da Licitação
  static async listarDocumentosLicitacao(licitacaoId) {
    const query = `
      SELECT *
      FROM documentos_licitacao
      WHERE licitacao_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [licitacaoId]);
    return result.rows;
  }

  static async verificarEditalExistente(licitacao_id) {
    const query = `
      SELECT id FROM documentos_licitacao 
      WHERE licitacao_id = $1 AND tipo = 'EDITAL'
    `;
    const result = await db.query(query, [licitacao_id]);
    return result.rows.length > 0;
  }

  static async salvarDocumentoLicitacao(dados) {
    // Se for um EDITAL, verificar se já existe um para esta licitação
    if (dados.tipo === 'EDITAL') {
      const editalExiste = await this.verificarEditalExistente(dados.licitacao_id);
      if (editalExiste) {
        throw new Error('Já existe um documento do tipo EDITAL para esta licitação. Remova o EDITAL existente antes de adicionar um novo.');
      }
    }

    const query = `
      INSERT INTO documentos_licitacao (
        licitacao_id,
        nome,
        tipo,
        nome_arquivo,
        caminho_arquivo,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      dados.licitacao_id,
      dados.nome,
      dados.tipo,
      dados.nome_arquivo,
      dados.caminho_arquivo,
      dados.observacoes
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async excluirDocumentoLicitacao(id) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Primeiro buscar o documento
      const docQuery = 'SELECT * FROM documentos_licitacao WHERE id = $1';
      const docResult = await client.query(docQuery, [id]);
      
      if (docResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const documento = docResult.rows[0];

      // Se for um EDITAL, remover os requisitos primeiro
      if (documento.tipo === 'EDITAL') {
        const deleteReqQuery = 'DELETE FROM requisitos_documentacao WHERE licitacao_id = $1';
        await client.query(deleteReqQuery, [documento.licitacao_id]);
      }

      // Depois remover o documento
      const deleteDocQuery = 'DELETE FROM documentos_licitacao WHERE id = $1 RETURNING *';
      const deleteResult = await client.query(deleteDocQuery, [id]);

      await client.query('COMMIT');
      return deleteResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Requisitos de Documentação
  static async listarRequisitosDocumentacao(licitacaoId) {
    const query = `
      SELECT 
        rd.*,
        dl.nome_arquivo as documento_nome,
        dl.caminho_arquivo as documento_caminho
      FROM requisitos_documentacao rd
      LEFT JOIN documentos_licitacao dl ON rd.documento_id = dl.id
      WHERE rd.licitacao_id = $1
      ORDER BY rd.created_at
    `;
    const result = await db.query(query, [licitacaoId]);
    return result.rows;
  }

  static async salvarRequisitosDocumentacao(dados) {
    const query = `
      INSERT INTO requisitos_documentacao (
        licitacao_id,
        descricao,
        atendido,
        documento_id,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      dados.licitacao_id,
      dados.descricao,
      dados.atendido || false,
      dados.documento_id,
      dados.observacoes
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async atualizarRequisitoDocumentacao(id, dados) {
    const query = `
      UPDATE requisitos_documentacao
      SET 
        descricao = $1,
        atendido = $2,
        documento_id = $3,
        observacoes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const values = [
      dados.descricao,
      dados.atendido,
      dados.documento_id,
      dados.observacoes,
      id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async excluirRequisitoDocumentacao(id) {
    const query = 'DELETE FROM requisitos_documentacao WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Documento; 