import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeDatabase } from './config/init';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Inicializa o banco de dados antes de renderizar a aplicação
initializeDatabase()
  .then(() => {
    console.log('Banco de dados inicializado com sucesso');
  })
  .catch((error) => {
    console.error('Erro ao inicializar o banco de dados:', error);
  });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer position="top-right" autoClose={3000} />
  </React.StrictMode>
);
