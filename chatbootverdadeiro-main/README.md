# 🤖 GeminiBot - Chatbot Inteligente com MongoDB

Um chatbot web moderno e inteligente que utiliza a API Gemini do Google com integração MongoDB para histórico de conversas e analytics.

## ✨ Funcionalidades

### 🎯 Funcionalidades Principais
- **Chat Inteligente**: Conversas naturais usando a API Gemini do Google
- **Funções Especiais**: 
  - 📅 Informações de data e hora atual
  - 🌤️ Previsão do tempo para qualquer cidade
  - 📚 Histórico de conversas
- **Interface Moderna**: Design responsivo com gradientes e animações
- **Indicador de Digitação**: Feedback visual durante o processamento
- **Timestamps**: Horário de cada mensagem
- **Sessões Persistentes**: Mantém o histórico entre recarregamentos

### 🗄️ Funcionalidades MongoDB
- **Histórico de Conversas**: Todas as conversas são salvas no banco
- **Analytics de Uso**: Estatísticas de uso e métricas
- **Logs de Acesso**: Registro de conexões com geolocalização
- **Índices Otimizados**: Performance melhorada para consultas

### 🎨 Interface
- **Design Responsivo**: Funciona em desktop e mobile
- **Tema Moderno**: Gradiente roxo com elementos glassmorphism
- **Animações Suaves**: Transições e efeitos visuais
- **Botão Limpar Histórico**: Reset rápido da conversa

## 🚀 Configuração

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# API Gemini (Obrigatório)
GEMINI_API_KEY=sua_chave_da_api_gemini_aqui

# MongoDB (Opcional - funciona sem)
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database

# OpenWeather API (Opcional - para função clima)
OPENWEATHER_API_KEY=sua_chave_openweather_aqui
```

### 3. Executar Localmente
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🌐 Deploy

### Deploy no Render.com

1. **Preparação**:
   - Faça commit de todas as alterações
   - Push para o GitHub

2. **Configuração no Render**:
   - Crie uma conta no [Render.com](https://render.com)
   - Conecte seu repositório GitHub
   - Configure as variáveis de ambiente:
     - `GEMINI_API_KEY`: Sua chave da API Gemini
     - `MONGO_URI`: String de conexão MongoDB (opcional)
     - `OPENWEATHER_API_KEY`: Chave OpenWeather (opcional)

3. **Configurações de Build**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

### Deploy no Vercel

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure as variáveis de ambiente no dashboard do Vercel

## 📁 Estrutura do Projeto

```
chatbootverdadeiro-main/
├── public/
│   ├── index.html          # Interface do usuário
│   ├── client.js           # JavaScript do frontend
│   └── style.css           # Estilos CSS
├── index.js                # Servidor backend
├── package.json            # Dependências e scripts
├── .env                    # Variáveis de ambiente
├── .gitignore             # Arquivos ignorados pelo Git
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Google Generative AI**: API Gemini para IA
- **MongoDB**: Banco de dados NoSQL
- **Axios**: Cliente HTTP
- **CORS**: Cross-Origin Resource Sharing
- **dotenv**: Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5**: Estrutura da página
- **CSS3**: Estilos e animações
- **JavaScript ES6+**: Lógica do frontend
- **Fetch API**: Comunicação com o backend

## 🔧 APIs Utilizadas

1. **Google Gemini API**: Processamento de linguagem natural
2. **OpenWeather API**: Dados meteorológicos (opcional)
3. **IP-API**: Geolocalização por IP

## 📊 Funcionalidades MongoDB

### Collections Criadas
- **conversations**: Histórico de conversas
- **accessLogs**: Logs de acesso dos usuários
- **analytics**: Métricas de uso

### Endpoints de API
- `GET /api/conversations/:sessionId`: Buscar histórico
- `GET /api/analytics`: Estatísticas de uso
- `POST /api/log-connection`: Registrar conexão
- `GET /api/user-info`: Informações do usuário

## 🎯 Comandos de Teste

### Testar Funcionalidades
1. **Chat Básico**: "Olá, como você está?"
2. **Data/Hora**: "Que horas são agora?"
3. **Clima**: "Como está o tempo em São Paulo?"
4. **Histórico**: "Mostre meu histórico de conversas"

## 🔒 Segurança

- ✅ API Keys protegidas em variáveis de ambiente
- ✅ CORS configurado adequadamente
- ✅ Validação de dados de entrada
- ✅ Tratamento de erros robusto

## 📱 Responsividade

O chatbot é totalmente responsivo e funciona em:
- 💻 Desktop (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Mobile (até 767px)

## 🐛 Solução de Problemas

### Erro de Conexão MongoDB
- O chatbot funciona normalmente mesmo sem MongoDB
- Verifique a string de conexão `MONGO_URI`
- Certifique-se de que o IP está na whitelist do MongoDB Atlas

### Erro de API Gemini
- Verifique se `GEMINI_API_KEY` está configurada corretamente
- Confirme se a chave tem permissões adequadas

### Problemas de CORS
- O CORS está configurado para aceitar todas as origens
- Em produção, configure origens específicas

## 📈 Melhorias Implementadas

### Versão Original → Versão Melhorada

1. **Interface**: Design básico → Interface moderna com gradientes
2. **Funcionalidades**: Chat simples → Chat com funções especiais
3. **Persistência**: Sem histórico → Histórico completo no MongoDB
4. **Analytics**: Nenhum → Métricas detalhadas de uso
5. **Responsividade**: Básica → Totalmente responsiva
6. **UX**: Simples → Indicadores visuais e animações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email do projeto.

---

**Desenvolvido com ❤️ usando Node.js, Express, MongoDB e Google Gemini API**

