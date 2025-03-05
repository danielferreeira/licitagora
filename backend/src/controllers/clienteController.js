const db = require('../config/database');

const validarCamposCliente = (cliente) => {
  const camposObrigatorios = [
    'razao_social',
    'cnpj',
    'email',
    'telefone',
    'cidade',
    'estado',
    'ramos_atividade'
  ];

  const camposFaltantes = camposObrigatorios.filter(campo => !cliente[campo]);

  if (camposFaltantes.length > 0) {
    throw new Error(`Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`);
  }
};

const listar = async (req, res) => {
  try {
    const { razao_social, cnpj, cidade, estado, ramo_atividade } = req.query;
    
    let query = `
      SELECT 
        id, 
        razao_social, 
        cnpj, 
        email, 
        telefone, 
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade, 
        estado, 
        ramos_atividade,
        created_at,
        updated_at
      FROM clientes
      WHERE 1=1
    `;

    const params = [];

    if (razao_social) {
      params.push(`%${razao_social}%`);
      query += ` AND razao_social ILIKE $${params.length}`;
    }

    if (cnpj) {
      params.push(`%${cnpj}%`);
      query += ` AND cnpj ILIKE $${params.length}`;
    }

    if (cidade) {
      params.push(`%${cidade}%`);
      query += ` AND cidade ILIKE $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }

    if (ramo_atividade) {
      params.push(`%${ramo_atividade}%`);
      query += ` AND ramos_atividade::text ILIKE $${params.length}`;
    }

    query += ' ORDER BY razao_social ASC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        id, 
        razao_social, 
        cnpj, 
        email, 
        telefone,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade, 
        estado, 
        ramos_atividade,
        created_at,
        updated_at
      FROM clientes 
      WHERE id = $1
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

const criar = async (req, res) => {
  try {
    const cliente = req.body;
    validarCamposCliente(cliente);

    const query = `
      INSERT INTO clientes (
        razao_social, 
        cnpj, 
        email, 
        telefone,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade, 
        estado, 
        ramos_atividade
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      cliente.razao_social,
      cliente.cnpj,
      cliente.email,
      cliente.telefone,
      cliente.cep,
      cliente.endereco,
      cliente.numero,
      cliente.complemento,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
      cliente.ramos_atividade
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error.message.includes('Campos obrigatórios')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = req.body;
    validarCamposCliente(cliente);

    const query = `
      UPDATE clientes 
      SET 
        razao_social = $1, 
        cnpj = $2, 
        email = $3, 
        telefone = $4,
        cep = $5,
        endereco = $6,
        numero = $7,
        complemento = $8,
        bairro = $9,
        cidade = $10, 
        estado = $11, 
        ramos_atividade = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      cliente.razao_social,
      cliente.cnpj,
      cliente.email,
      cliente.telefone,
      cliente.cep,
      cliente.endereco,
      cliente.numero,
      cliente.complemento,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
      cliente.ramos_atividade,
      id
    ];

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (error.message.includes('Campos obrigatórios')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM clientes WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
};

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir
}; 