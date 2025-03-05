require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function createTable() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'create_prazos_table.sql'),
      'utf8'
    );

    await pool.query(sql);
    console.log('Tabela prazos criada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createTable(); 