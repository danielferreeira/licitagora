# Licitagora

Sistema de gerenciamento de licitações e prazos, desenvolvido para auxiliar empresas no acompanhamento e participação em processos licitatórios.

## 🚀 Funcionalidades

- 📋 Cadastro e gerenciamento completo de licitações
- ⏰ Controle de prazos e deadlines
- 📅 Calendário interativo com visualização de eventos
- 🔄 Importação automática de prazos das licitações
- 📱 Interface moderna e responsiva
- 📄 Gestão de documentos e requisitos
- 📊 Acompanhamento de status e resultados

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- date-fns
- JWT para autenticação
- Multer para upload de arquivos

### Frontend
- React com Vite
- Material-UI (MUI)
- React Big Calendar
- Axios
- React Router DOM
- Context API para gerenciamento de estado

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL (versão 12 ou superior)
- NPM ou Yarn
- Git

## 🔧 Configuração do Ambiente

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

3. Configure o banco de dados:
```bash
# Execute o script SQL inicial
psql -U seu_usuario -d licitagora -f dados_exemplo.sql
```

4. Configure o frontend:
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
```

5. Inicie o backend:
```bash
cd backend
npm run dev
```

6. Inicie o frontend:
```bash
cd frontend
npm run dev
```

## 📁 Estrutura do Projeto

```
licitagora/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Controladores da aplicação
│   │   ├── models/         # Modelos do Sequelize
│   │   ├── routes/         # Rotas da API
│   │   ├── config/         # Configurações
│   │   ├── middlewares/    # Middlewares
│   │   └── utils/          # Utilitários
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── pages/          # Páginas da aplicação
    │   ├── services/       # Serviços e API
    │   ├── contexts/       # Contextos React
    │   └── utils/          # Utilitários
    └── package.json
```

## 🤝 Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature:
```bash
git checkout -b feature/nova-feature
```
3. Faça commit das suas alterações:
```bash
git commit -m 'feat: Adiciona nova feature'
```
4. Faça push para a branch:
```bash
git push origin feature/nova-feature
```
5. Abra um Pull Request

### Padrões de Commit

Utilizamos o padrão Conventional Commits:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Atualização de documentação
- `style`: Mudanças que não afetam o código
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Mudanças no processo de build ou ferramentas auxiliares

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

* **Seu Nome** - *Trabalho Inicial* - [seu-usuario](https://github.com/seu-usuario)

## 📮 Contato

Para sugestões, dúvidas ou contribuições, entre em contato através de:
- Email: seu-email@exemplo.com
- Issues do GitHub 