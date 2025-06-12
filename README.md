# Chatbot com Gemini API

Este é um chatbot web que utiliza a API Gemini do Google para processar mensagens e executar funções específicas.

## Funcionalidades

O chatbot pode:
- Responder perguntas gerais usando a API Gemini
- Informar a data e hora atual
- Fornecer informações sobre o clima de qualquer cidade

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   GEMINI_API_KEY=sua_chave_api_gemini
   OPENWEATHER_API_KEY=sua_chave_api_openweather
   ```

## Como Usar

1. Inicie o servidor:
   ```bash
   node index.js
   ```
2. Acesse `http://localhost:3000` no seu navegador

## Exemplos de Uso

Você pode fazer perguntas como:
- "Que horas são?"
- "Qual o tempo em São Paulo?"
- "Me diga a previsão do tempo para Curitiba"

## Tecnologias Utilizadas

- Node.js
- Express
- Google Generative AI (Gemini)
- OpenWeather API
- Axios

## Características do Bot

- **Personalidade**: Amigável e prestativo
- **Respostas**: Concisas e diretas
- **Linguagem**: Simples e acessível
- **Tom**: Profissional mas descontraído

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

## Links

- [Aplicação em Produção](https://chatbot-2zn1.onrender.com)
- [Documentação da API Gemini](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://makersuite.google.com/app) 