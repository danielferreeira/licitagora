require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');

// Importar modelos para garantir que os relacionamentos são configurados
require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar pasta de uploads como estática
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api', require('./routes'));

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

const PORT = process.env.PORT || 3001;

// Sincronizar modelos com o banco de dados
sequelize.sync()
  .then(() => {
    console.log('Modelos sincronizados com o banco de dados');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar modelos:', err);
  }); 