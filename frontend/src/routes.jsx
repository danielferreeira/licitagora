import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Páginas
import Login from './pages/Login/LoginPage';
import Home from './pages/Home/HomePage';
import Clientes from './pages/Clientes/ClientesPage';
import Licitacoes from './pages/Licitacoes/LicitacoesPage';
import Documentos from './pages/Documentos/DocumentosPage';
import Relatorios from './pages/Relatorios/RelatoriosPage';
import Prazos from './pages/Prazos/PrazosPage';
import Fechamento from './pages/Fechamento/FechamentoPage';
import Financeiro from './pages/Financeiro/FinanceiroPage';
import NotFound from './pages/NotFound/NotFoundPage';
import BuscarLicitacoes from './pages/BuscarLicitacoes/BuscarLicitacoesPage';
import NovaLicitacao from './pages/NovaLicitacao/NovaLicitacaoPage';
import EditarLicitacao from './pages/EditarLicitacao/EditarLicitacaoPage';
import VisualizarLicitacao from './pages/VisualizarLicitacao/VisualizarLicitacaoPage';
import Franquias from './pages/Franquias/FranquiasPage';
import FranquiaClientes from './pages/FranquiaClientes/FranquiaClientesPage';
import TestAuth from './TestAuth';
import RedefinirSenha from './components/RedefinirSenha/RedefinirSenha';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/test-auth" element={<TestAuth />} />
      
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

        {/* Franquias - Apenas para Administradores */}
        <Route path="franquias" element={<Franquias />} />
        <Route path="franquias/:id/clientes" element={<FranquiaClientes />} />
      </Route>
      
      {/* Rota para página não encontrada */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 