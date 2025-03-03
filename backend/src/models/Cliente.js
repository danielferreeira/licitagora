const db = require('../config/database');

class Cliente {
  static async criar(cliente) {
    try {
      const { 
        razao_social, cnpj, email, telefone, 
        cep, endereco, numero, complemento, bairro,
        cidade, estado, ramos_atividade 
      } = cliente;
      
      // Limpa os dados antes de inserir
      const dadosLimpos = {
        razao_social: razao_social.trim(),
        cnpj: cnpj.replace(/\D/g, ''),
        email: email.trim().toLowerCase(),
        telefone: telefone.replace(/\D/g, ''),
        cep: cep ? cep.replace(/\D/g, '') : null,
        endereco: endereco ? endereco.trim() : null,
        numero: numero ? numero.trim() : null,
        complemento: complemento ? complemento.trim() : null,
        bairro: bairro ? bairro.trim() : null,
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        ramos_atividade
      };
      
      const query = `
        INSERT INTO clientes (
          razao_social, cnpj, email, telefone, 
          cep, endereco, numero, complemento, bairro,
          cidade, estado, ramos_atividade
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      console.log('Executando query com valores:', dadosLimpos);
      const values = [
        dadosLimpos.razao_social,
        dadosLimpos.cnpj,
        dadosLimpos.email,
        dadosLimpos.telefone,
        dadosLimpos.cep,
        dadosLimpos.endereco,
        dadosLimpos.numero,
        dadosLimpos.complemento,
        dadosLimpos.bairro,
        dadosLimpos.cidade,
        dadosLimpos.estado,
        dadosLimpos.ramos_atividade
      ];

      const result = await db.query(query, values);
      console.log('Resultado da query:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro no modelo ao criar cliente:', error);
      throw error;
    }
  }

  static async listar() {
    try {
      const query = 'SELECT * FROM clientes ORDER BY razao_social';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro no modelo ao listar clientes:', error);
      throw error;
    }
  }

  static async buscarPorId(id) {
    try {
      const query = 'SELECT * FROM clientes WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro no modelo ao buscar cliente:', error);
      throw error;
    }
  }

  static async atualizar(id, cliente) {
    try {
      const { 
        razao_social, cnpj, email, telefone, 
        cep, endereco, numero, complemento, bairro,
        cidade, estado, ramos_atividade 
      } = cliente;
      
      // Limpa os dados antes de atualizar
      const dadosLimpos = {
        razao_social: razao_social.trim(),
        cnpj: cnpj.replace(/\D/g, ''),
        email: email.trim().toLowerCase(),
        telefone: telefone.replace(/\D/g, ''),
        cep: cep ? cep.replace(/\D/g, '') : null,
        endereco: endereco ? endereco.trim() : null,
        numero: numero ? numero.trim() : null,
        complemento: complemento ? complemento.trim() : null,
        bairro: bairro ? bairro.trim() : null,
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        ramos_atividade
      };
      
      const query = `
        UPDATE clientes 
        SET razao_social = $1, cnpj = $2, email = $3, telefone = $4, 
            cep = $5, endereco = $6, numero = $7, complemento = $8, bairro = $9,
            cidade = $10, estado = $11, ramos_atividade = $12
        WHERE id = $13
        RETURNING *
      `;
      
      const values = [
        dadosLimpos.razao_social,
        dadosLimpos.cnpj,
        dadosLimpos.email,
        dadosLimpos.telefone,
        dadosLimpos.cep,
        dadosLimpos.endereco,
        dadosLimpos.numero,
        dadosLimpos.complemento,
        dadosLimpos.bairro,
        dadosLimpos.cidade,
        dadosLimpos.estado,
        dadosLimpos.ramos_atividade,
        id
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro no modelo ao atualizar cliente:', error);
      throw error;
    }
  }

  static async deletar(id) {
    try {
      const query = 'DELETE FROM clientes WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro no modelo ao deletar cliente:', error);
      throw error;
    }
  }
}

module.exports = Cliente; 