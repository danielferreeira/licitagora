import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Licitacoes from './pages/Licitacoes';
import NovaLicitacao from './pages/NovaLicitacao';
import EditarLicitacao from './pages/EditarLicitacao';
import Documentos from './pages/Documentos';
import Prazos from './pages/Prazos';
import Relatorios from './pages/Relatorios';
import Fechamento from './pages/Fechamento';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/licitacoes" element={<Licitacoes />} />
              <Route path="/licitacoes/nova" element={<NovaLicitacao />} />
              <Route path="/licitacoes/:id/editar" element={<EditarLicitacao />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/prazos" element={<Prazos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/fechamento" element={<Fechamento />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
