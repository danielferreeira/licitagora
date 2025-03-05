require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

// Configuração do Sequelize
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'licitagora',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  define: {
    timestamps: true,
    underscored: true,
  },
  logging: console.log,
  dialectOptions: {
    useUTC: false,
    timezone: '-03:00',
  },
  timezone: '-03:00',
});

// Teste a conexão do Sequelize
sequelize.authenticate()
  .then(() => {
    console.log('Conexão Sequelize estabelecida com sucesso');
  })
  .catch(err => {
    console.error('Erro ao conectar com Sequelize:', err);
  });

// Configuração do Pool do pg
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'licitagora',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Evento de erro na pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco de dados:', err);
});

// Teste a conexão do pool
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao pool:', err);
    return;
  }
  console.log('Conexão pool estabelecida com sucesso');
  release();
});

// Função helper para queries com pool
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Erro ao executar query:', err);
    throw err;
  }
}

// Exportações
module.exports = {
  sequelize: sequelize,
  pool: pool,
  query: query
}; 