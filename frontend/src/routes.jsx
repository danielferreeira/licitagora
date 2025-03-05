import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Licitacoes from './pages/Licitacoes';
import Documentos from './pages/Documentos';
import Fechamento from './pages/Fechamento';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/clientes',
        element: <Clientes />
      },
      {
        path: '/licitacoes',
        element: <Licitacoes />
      },
      {
        path: '/documentos',
        element: <Documentos />
      },
      {
        path: '/fechamento',
        element: <Fechamento />
      }
    ]
  }
]);

export default router; 