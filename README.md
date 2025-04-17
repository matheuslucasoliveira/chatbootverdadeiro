# GeminiBot - Chatbot Web com Google AI

Um chatbot web interativo construído com a API Gemini do Google AI. O bot possui uma interface amigável e moderna, permitindo conversas naturais e interativas.

## Características do Bot

- **Personalidade**: Amigável e prestativo
- **Respostas**: Concisas e diretas
- **Linguagem**: Simples e acessível
- **Tom**: Profissional mas descontraído

## Tecnologias Utilizadas

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- API: Google Gemini AI
- Deploy: Vercel (frontend) e Render (backend)

## Como Executar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/gemini-chatbot.git
cd gemini-chatbot
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a API Key:
- Crie um arquivo `.env` na raiz do projeto
- Adicione sua chave da API Gemini:
```
GEMINI_API_KEY=sua-chave-aqui
```

4. Inicie o servidor:
```bash
npm start
```

5. Acesse o chatbot:
- Abra seu navegador
- Acesse: http://localhost:3000

## Estrutura do Projeto

```
gemini-chatbot/
├── public/           # Arquivos estáticos (frontend)
│   ├── index.html   # Página principal
│   ├── style.css    # Estilos
│   └── client.js    # JavaScript do cliente
├── index.js         # Servidor Express (backend)
├── package.json     # Dependências
└── .env            # Configurações (não versionado)
```

## Funcionalidades

- Interface web amigável
- Conversas em tempo real
- Respostas contextuais
- Design responsivo
- Histórico de mensagens
- Indicador de digitação

## Links

- [Aplicação em Produção](https://chatbot-2zn1.onrender.com)
- [Documentação da API Gemini](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://makersuite.google.com/app) 