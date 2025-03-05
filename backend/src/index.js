require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar pasta de uploads como estática
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/licitacoes', require('./routes/licitacoes'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/prazos', require('./routes/prazos'));

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 