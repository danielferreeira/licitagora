# LicitÁgora

Sistema de gerenciamento de licitações desenvolvido com React e Node.js.

## 🚀 Tecnologias

### Frontend
- React
- Material-UI (MUI)
- React Router DOM
- Axios
- Date-fns

### Backend
- Node.js
- Express
- PostgreSQL
- Redis
- JWT

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/licitagora.git
cd licitagora
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

3. Configure as variáveis de ambiente do backend:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

5. Configure as variáveis de ambiente do frontend:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## 🚀 Executando o projeto

1. Inicie o backend:
```bash
cd backend
npm run dev
```

2. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm run dev
```

## 📦 Estrutura do Projeto

```
licitagora/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── theme.js
    │   └── App.jsx
    ├── package.json
    └── .env
```

## 🛠️ Funcionalidades

- Gestão de clientes
- Gestão de licitações
- Acompanhamento de prazos
- Gestão de documentos
- Relatórios e análises

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.

## ✨ Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 