import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import DefaultLayout from './layouts/DefaultLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteForm from './pages/Clientes/ClienteForm';
import ClienteDetalhes from './pages/Clientes/ClienteDetalhes';
import Licitacoes from './pages/Licitacoes';
import LicitacaoForm from './pages/Licitacoes/LicitacaoForm';
import LicitacaoDetalhes from './pages/Licitacoes/LicitacaoDetalhes';
import BuscarLicitacoes from './pages/BuscarLicitacoes';
import Relatorios from './pages/Relatorios';
import Prazos from './pages/Prazos';
import PrazoForm from './pages/Prazos/PrazoForm';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Auth
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rotas privadas */}
        <Route path="/" element={<PrivateRoute><DefaultLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          
          {/* Clientes */}
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<ClienteForm />} />
          <Route path="/clientes/editar/:id" element={<ClienteForm />} />
          <Route path="/clientes/:id" element={<ClienteDetalhes />} />
          
          {/* Licitações */}
          <Route path="/licitacoes" element={<Licitacoes />} />
          <Route path="/licitacoes/nova" element={<LicitacaoForm />} />
          <Route path="/licitacoes/editar/:id" element={<LicitacaoForm />} />
          <Route path="/licitacoes/:id" element={<LicitacaoDetalhes />} />
          <Route path="/buscar-licitacoes" element={<BuscarLicitacoes />} />
          
          {/* Relatórios */}
          <Route path="/relatorios" element={<Relatorios />} />
          
          {/* Prazos */}
          <Route path="/prazos" element={<Prazos />} />
          <Route path="/prazos/novo" element={<PrazoForm />} />
          <Route path="/prazos/editar/:id" element={<PrazoForm />} />
        </Route>

        {/* Página não encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes; 