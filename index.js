import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';
import { MongoClient } from 'mongodb';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create Express app
const app = express();
const tools = [
    {
      functionDeclarations: [
        {
          name: "getCurrentTime",
          description: "Obtém a data e hora atuais.",
          parameters: { type: "object", properties: {} }
        },
        {
          name: "getWeather",
          description: "Obtém a previsão do tempo atual para uma cidade específica.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "A cidade para a qual obter a previsão do tempo (ex: 'Curitiba, BR')."
              }
            },
            required: ["location"]
          }
        }
      ]
    }
];

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
let db;
let mongoConnected = false;

async function connectDB() {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
        console.log("MONGO_URI não configurado. Continuando sem MongoDB.");
        return;
    }

    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
        connectTimeoutMS: 10000,
    });

    try {
        await client.connect();
        db = client.db("IIW2023B_Logs");
        mongoConnected = true;
        console.log("Conectado ao MongoDB Atlas!");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB Atlas:", error.message);
        console.log("Continuando sem MongoDB. Os logs serão apenas exibidos no console.");
        mongoConnected = false;
    }
}

// Função para obter a hora atual
function getCurrentTime() {
  console.log("Executando getCurrentTime");
  return { currentTime: new Date().toLocaleString() };
}

// Função para obter o clima
async function getWeather(args) {
  console.log("Executando getWeather com args:", args);
  const location = args.location;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("Chave da API OpenWeatherMap não configurada.");
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=pt_br`;
  try {
    const response = await axios.get(url);
    return {
      location: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description
    };
  } catch (error) {
    console.error("Erro ao chamar OpenWeatherMap:", error.response?.data || error.message);
    return { error: error.response?.data?.message || "Não foi possível obter o tempo." };
  }
}

// Mapeamento de funções disponíveis
const availableFunctions = {
  getCurrentTime: getCurrentTime,
  getWeather: getWeather
};

// System instruction that defines the chatbot's personality
const SYSTEM_INSTRUCTION = `Você é um assistente amigável e prestativo chamado GeminiBot. \nSua personalidade é:\n- Amigável e acolhedor\n- Respostas concisas e diretas\n- Usa linguagem simples e acessível\n- Mantém um tom profissional mas descontraído\n- Sempre tenta ajudar da melhor forma possível\n- Quando perguntado sobre data e hora, fornece a informação atual de forma clara e amigável`;

async function generateResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: tools
        });
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        });
        
        const response = await result.response;
        
        // Verifica se há chamadas de função
        if (response.functionCalls && response.functionCalls().length > 0) {
            const functionCall = response.functionCalls()[0];
            const functionToCall = availableFunctions[functionCall.name];
            const functionArgs = functionCall.args;
            
            // Executa a função
            const functionResult = await functionToCall(functionArgs);
            
            // Envia o resultado de volta para o Gemini
            const resultFromFunctionCall = await model.generateContent({
                contents: [
                    { role: "user", parts: [{ text: prompt }] },
                    {
                        role: "function",
                        parts: [{
                            functionResponse: {
                                name: functionCall.name,
                                response: functionResult
                            }
                        }]
                    }
                ]
            });
            
            return resultFromFunctionCall.response.text();
        }
        
        return response.text();
    } catch (error) {
        console.error("Erro:", error);
        throw new Error("Erro ao processar a mensagem");
    }
}

// Endpoint para registrar logs de conexão
app.post('/api/log-connection', async (req, res) => {
    try {
        const { ip, acao } = req.body;

        if (!ip || !acao) {
            return res.status(400).json({ error: "Dados de log incompletos (IP e ação são obrigatórios)." });
        }

        const agora = new Date();
        const dataFormatada = agora.toISOString().split('T')[0]; // YYYY-MM-DD
        const horaFormatada = agora.toTimeString().split(' ')[0]; // HH:MM:SS

        const logEntry = {
            col_data: dataFormatada,
            col_hora: horaFormatada,
            col_IP: ip,
            col_acao: acao
        };

        console.log("Log de conexão:", logEntry);

        if (mongoConnected && db) {
            const collection = db.collection("tb_cl_user_log_acess");
            await collection.insertOne(logEntry);
            res.status(201).json({ message: "Log de conexão registrado com sucesso no MongoDB!" });
        } else {
            res.status(201).json({ message: "Log de conexão registrado (apenas no console - MongoDB não disponível)." });
        }
    } catch (error) {
        console.error("Erro ao registrar log de conexão:", error);
        res.status(500).json({ error: "Erro interno do servidor ao registrar log." });
    }
});

// Array para simular o armazenamento de dados de ranking
let dadosRankingVitrine = [];

// Endpoint para registrar acesso a bot para ranking
app.post('/api/ranking/registrar-acesso-bot', (req, res) => {
    const { botId, nomeBot, timestampAcesso, usuarioId } = req.body;

    if (!botId || !nomeBot) {
        return res.status(400).json({ error: "ID e Nome do Bot são obrigatórios para o ranking." });
    }

    const acesso = {
        botId,
        nomeBot,
        usuarioId: usuarioId || 'anonimo',
        acessoEm: timestampAcesso ? new Date(timestampAcesso) : new Date(),
        contagem: 1
    };

    const botExistente = dadosRankingVitrine.find(b => b.botId === botId);
    if (botExistente) {
        botExistente.contagem += 1;
        botExistente.ultimoAcesso = acesso.acessoEm;
    } else {
        dadosRankingVitrine.push({
            botId: botId,
            nomeBot: nomeBot,
            contagem: 1,
            ultimoAcesso: acesso.acessoEm
        });
    }
    
    console.log('[Servidor] Dados de ranking atualizados:', dadosRankingVitrine);
    res.status(201).json({ message: `Acesso ao bot ${nomeBot} registrado para ranking.` });
});

// Endpoint para visualizar dados de ranking simulados
app.get('/api/ranking/visualizar', (req, res) => {
    const rankingOrdenado = [...dadosRankingVitrine].sort((a, b) => b.contagem - a.contagem);
    res.json(rankingOrdenado);
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await generateResponse(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export the Express API
export default app;

// Iniciar o servidor
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
        console.log(`MongoDB conectado: ${mongoConnected ? 'Sim' : 'Não'}`);
    });
});

