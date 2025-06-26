# 🚀 Instruções de Deploy - GeminiBot

## 📋 Pré-requisitos

- Conta no GitHub
- Chave da API Gemini do Google
- Conta no Render.com (gratuita)
- MongoDB Atlas (opcional, mas recomendado)

## 🔑 Obtendo as Chaves de API

### 1. Google Gemini API
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. MongoDB Atlas (Opcional)
1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster gratuito
4. Configure o acesso (IP whitelist: 0.0.0.0/0 para acesso global)
5. Crie um usuário de banco de dados
6. Obtenha a string de conexão

### 3. OpenWeather API (Opcional)
1. Acesse [OpenWeatherMap](https://openweathermap.org/api)
2. Crie uma conta gratuita
3. Obtenha sua API key

## 🌐 Deploy no Render.com

### Passo 1: Preparar o Repositório
```bash
# Clone ou baixe o projeto
git clone seu-repositorio
cd chatbootverdadeiro-main

# Instale dependências localmente para testar
npm install

# Teste localmente
npm start
```

### Passo 2: Configurar no GitHub
1. Crie um repositório no GitHub
2. Faça upload dos arquivos ou clone
3. Certifique-se de que o `.env` NÃO está no repositório

### Passo 3: Deploy no Render
1. **Acesse [Render.com](https://render.com)**
2. **Crie uma conta** (pode usar GitHub)
3. **Clique em "New +"** → **"Web Service"**
4. **Conecte o GitHub** e selecione seu repositório
5. **Configure o serviço**:
   - **Name**: `meu-geminibot` (ou nome de sua escolha)
   - **Region**: Escolha a mais próxima
   - **Branch**: `main` ou `master`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Passo 4: Configurar Variáveis de Ambiente
Na seção **Environment Variables**, adicione:

```
GEMINI_API_KEY=sua_chave_gemini_aqui
MONGO_URI=sua_string_mongodb_aqui
OPENWEATHER_API_KEY=sua_chave_openweather_aqui
```

### Passo 5: Deploy
1. Clique em **"Create Web Service"**
2. Aguarde o build (pode demorar alguns minutos)
3. Sua URL será algo como: `https://meu-geminibot.onrender.com`

## 🔧 Deploy Alternativo - Vercel

### Configuração Vercel
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente
vercel env add GEMINI_API_KEY
vercel env add MONGO_URI
vercel env add OPENWEATHER_API_KEY
```

## 🐛 Solução de Problemas Comuns

### ❌ Erro: "Cannot find module 'express'"
**Solução**: Verifique se `package.json` está no repositório e `npm install` está no build command.

### ❌ Erro: "GEMINI_API_KEY not defined"
**Solução**: Configure a variável de ambiente no painel do Render.

### ❌ Erro de CORS
**Solução**: O código já tem CORS configurado. Se persistir, verifique se o frontend está acessando a URL correta.

### ❌ MongoDB Connection Error
**Solução**: 
- Verifique a string de conexão
- Confirme que o IP 0.0.0.0/0 está na whitelist
- O chatbot funciona sem MongoDB

### ❌ Build Failed
**Solução**:
- Verifique se `package.json` está correto
- Confirme que todas as dependências estão listadas
- Veja os logs de build no Render

## 📊 Monitoramento

### Logs do Render
1. Acesse seu serviço no Render
2. Vá para a aba "Logs"
3. Monitore erros e performance

### Teste de Funcionalidades
Após o deploy, teste:
- ✅ Chat básico
- ✅ Função de data/hora
- ✅ Função de clima (se configurada)
- ✅ Responsividade mobile

## 🔄 Atualizações

Para atualizar o chatbot:
1. Faça alterações no código
2. Commit e push para o GitHub
3. O Render fará redeploy automaticamente

## 💡 Dicas de Otimização

### Performance
- Use MongoDB para melhor performance
- Configure cache se necessário
- Monitore uso de recursos

### Segurança
- Nunca exponha API keys no código
- Use HTTPS sempre
- Configure CORS adequadamente

### Escalabilidade
- Considere upgrade para planos pagos se necessário
- Monitore limites de API
- Implemente rate limiting se necessário

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Render
2. Teste localmente primeiro
3. Consulte a documentação das APIs
4. Abra uma issue no GitHub

---

**🎉 Parabéns! Seu chatbot está agora online e acessível globalmente!**

