require('dotenv').config();
const sequelize = require('../config/database');
const Prazo = require('../models/Prazo');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // Sincroniza o modelo com o banco de dados
    await Prazo.sync({ force: true });
    console.log('Tabela prazos criada com sucesso.');

    process.exit(0);
  } catch (error) {
    console.error('Erro ao sincronizar o banco de dados:', error);
    process.exit(1);
  }
}

syncDatabase(); 