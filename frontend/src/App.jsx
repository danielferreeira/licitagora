import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Licitacoes from './pages/Licitacoes';
import BuscarLicitacoes from './pages/BuscarLicitacoes';
import Documentos from './pages/Documentos';
import Prazos from './pages/Prazos';
import Relatorios from './pages/Relatorios';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/licitacoes" element={<Licitacoes />} />
            <Route path="/licitacoes/buscar" element={<BuscarLicitacoes />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/prazos" element={<Prazos />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <ToastContainer position="top-right" />
    </ThemeProvider>
  );
}

export default App;
