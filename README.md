# Licitagora

Sistema de gerenciamento de licitações e prazos.

## Funcionalidades

- Cadastro e gerenciamento de licitações
- Controle de prazos e deadlines
- Calendário interativo
- Importação automática de prazos
- Interface moderna e responsiva

## Tecnologias Utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- Sequelize

### Frontend
- React
- Material-UI (MUI)
- React Big Calendar
- Day.js
- Axios

## Pré-requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL (versão 12 ou superior)
- NPM ou Yarn

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/licitagora.git
cd licitagora
```

2. Configure o backend:
```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
```

3. Configure o frontend:
```bash
cd frontend
npm install
```

4. Inicie o backend:
```bash
cd backend
npm run dev
```

5. Inicie o frontend:
```bash
cd frontend
npm start
```

## Estrutura do Projeto

```
licitagora/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── config/
│   │   └── index.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── App.js
    └── package.json
```

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 