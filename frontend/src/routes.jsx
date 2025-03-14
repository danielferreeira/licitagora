import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login/index';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Licitacoes from './pages/Licitacoes';
import Documentos from './pages/Documentos';
import Relatorios from './pages/Relatorios';
import Prazos from './pages/Prazos';
import Fechamento from './pages/Fechamento';
import Financeiro from './pages/Financeiro';
import NotFound from './pages/NotFound';
import BuscarLicitacoes from './pages/BuscarLicitacoes';
import NovaLicitacao from './pages/NovaLicitacao';
import EditarLicitacao from './pages/EditarLicitacao';
import VisualizarLicitacao from './pages/VisualizarLicitacao';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<Login />} />
      
      {/* Rotas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        
        {/* Clientes */}
        <Route path="clientes" element={<Clientes />} />
        
        {/* Licitações */}
        <Route path="licitacoes" element={<Licitacoes />} />
        <Route path="licitacoes/nova" element={<NovaLicitacao />} />
        <Route path="licitacoes/editar/:id" element={<EditarLicitacao />} />
        <Route path="licitacoes/:id/editar" element={<EditarLicitacao />} />
        <Route path="licitacoes/:id" element={<VisualizarLicitacao />} />
        <Route path="buscar-licitacoes" element={<BuscarLicitacoes />} />
        
        {/* Documentos */}
        <Route path="documentos" element={<Documentos />} />
        
        {/* Fechamento */}
        <Route path="fechamento" element={<Fechamento />} />
        
        {/* Financeiro */}
        <Route path="financeiro" element={<Financeiro />} />
        
        {/* Relatórios */}
        <Route path="relatorios" element={<Relatorios />} />
        
        {/* Prazos */}
        <Route path="prazos" element={<Prazos />} />
      </Route>
      
      {/* Rota para página não encontrada */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 