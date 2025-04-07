# LicitAgora - Frontend

Este projeto é o frontend do sistema LicitAgora, desenvolvido com React e Vite.

## Tecnologias Utilizadas

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Material UI](https://mui.com/)
- [Supabase](https://supabase.io/)
- [React Router](https://reactrouter.com/)

## Estrutura do Projeto

```
frontend/
  ├── public/              # Arquivos públicos
  ├── src/                 # Código fonte
  │   ├── assets/          # Imagens e assets
  │   ├── components/      # Componentes reutilizáveis
  │   ├── contexts/        # Contextos do React
  │   ├── hooks/           # Hooks personalizados
  │   ├── pages/           # Páginas da aplicação
  │   ├── services/        # Serviços para API
  │   │   ├── api/         # Serviços modulares
  │   │   └── README.md    # Documentação dos serviços
  │   ├── theme/           # Configuração de tema
  │   ├── utils/           # Funções utilitárias
  │   ├── App.jsx          # Componente principal
  │   └── main.jsx         # Ponto de entrada
  ├── package.json         # Dependências
  └── vite.config.js       # Configuração do Vite
```

## Serviços da API

O projeto foi estruturado com uma abordagem modular para os serviços da API, organizados na pasta `src/services/api/`. Consulte o arquivo [src/services/README.md](src/services/README.md) para mais detalhes sobre como usar os serviços.

Serviços disponíveis:
- authService: Autenticação e gerenciamento de usuários
- franquiaService: Gerenciamento de franquias
- clienteService: Gerenciamento de clientes
- licitacaoService: Gerenciamento de licitações
- documentoService: Gerenciamento de documentos
- relatorioService: Geração de relatórios
- prazoService: Gerenciamento de prazos

## Instalação e Execução

```
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Visualizar build de produção localmente
npm run preview
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_KEY=sua_chave_supabase
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
