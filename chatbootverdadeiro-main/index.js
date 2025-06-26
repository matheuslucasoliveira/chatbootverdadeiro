import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cors from 'cors';

// Carregar variáveis de ambiente
dotenv.config();

// Debug: Verificar variáveis de ambiente
console.log('Variáveis de ambiente carregadas:', {
    MONGO_URI: process.env.MONGO_URI ? 'Definida' : 'Não definida',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Definida' : 'Não definida',
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ? 'Definida' : 'Não definida'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do MongoDB
const mongoUri = process.env.MONGO_URI;
let client = null;
let db = null;

// Função para conectar ao MongoDB
async function connectDB() {
    if (db) return db; // Se já conectado, retorna a instância
    
    if (!mongoUri) {
        console.error("MONGO_URI não definida no .env!");
        throw new Error("MONGO_URI não definida");
    }

    try {
        if (!client) {
            client = new MongoClient(mongoUri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            await client.connect();
        }
        
        db = client.db("ifcodeLogsDB");
        console.log("Conectado ao MongoDB Atlas!");
        
        // Criar índices para melhor performance
        await createIndexes();
        
        return db;
    } catch (err) {
        console.error("Falha ao conectar ao MongoDB:", err);
        throw err;
    }
}

// Função para criar índices no MongoDB
async function createIndexes() {
    try {
        const conversationsCollection = db.collection("conversations");
        const accessLogsCollection = db.collection("accessLogs");
        const analyticsCollection = db.collection("analytics");

        // Índices para conversas
        await conversationsCollection.createIndex({ sessionId: 1 });
        await conversationsCollection.createIndex({ timestamp: -1 });
        await conversationsCollection.createIndex({ ipAddress: 1 });

        // Índices para logs de acesso
        await accessLogsCollection.createIndex({ ipAddress: 1 });
        await accessLogsCollection.createIndex({ connectionTime: -1 });

        // Índices para analytics
        await analyticsCollection.createIndex({ date: -1 });
        await analyticsCollection.createIndex({ type: 1 });

        console.log("Índices criados com sucesso!");
    } catch (error) {
        console.error("Erro ao criar índices:", error);
    }
}

// Create Express app
const app = express();

// Configurar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
        },
        {
          name: "getChatHistory",
          description: "Obtém o histórico de conversas do usuário.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Número máximo de mensagens para retornar (padrão: 10)"
              }
            }
          }
        }
      ]
    }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para conectar ao MongoDB antes de cada requisição
app.use(async (req, res, next) => {
    try {
        if (!db) {
            await connectDB();
        }
        next();
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        res.status(500).json({ error: "Erro de conexão com o banco de dados" });
    }
});

// Função para gerar ID de sessão único
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para obter a hora atual
function getCurrentTime() {
    console.log("Executando getCurrentTime");
    return { currentTime: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) };
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
            description: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            windSpeed: response.data.wind.speed
        };
    } catch (error) {
        console.error("Erro ao chamar OpenWeatherMap:", error.response?.data || error.message);
        return { error: error.response?.data?.message || "Não foi possível obter o tempo." };
    }
}

// Função para obter histórico de chat
async function getChatHistory(args, sessionId) {
    console.log("Executando getChatHistory com args:", args);
    const limit = args.limit || 10;
    
    try {
        const collection = db.collection("conversations");
        const history = await collection
            .find({ sessionId: sessionId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        
        return {
            history: history.reverse().map(conv => ({
                message: conv.userMessage,
                response: conv.botResponse,
                timestamp: conv.timestamp
            }))
        };
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return { error: "Não foi possível obter o histórico." };
    }
}

// Mapeamento de funções disponíveis
const availableFunctions = {
    getCurrentTime: getCurrentTime,
    getWeather: getWeather,
    getChatHistory: getChatHistory
};

// System instruction que define a personalidade do chatbot
const SYSTEM_INSTRUCTION = `Você é um assistente amigável e prestativo chamado GeminiBot. 
Sua personalidade é:
- Amigável e acolhedor
- Respostas concisas e diretas
- Usa linguagem simples e acessível
- Mantém um tom profissional mas descontraído
- Sempre tenta ajudar da melhor forma possível
- Quando perguntado sobre data e hora, fornece a informação atual de forma clara e amigável
- Pode acessar histórico de conversas quando solicitado
- Fornece informações meteorológicas quando perguntado sobre o clima`;

// Função para salvar conversa no MongoDB
async function saveConversation(sessionId, userMessage, botResponse, userInfo) {
    try {
        const collection = db.collection("conversations");
        const conversationData = {
            sessionId: sessionId,
            userMessage: userMessage,
            botResponse: botResponse,
            timestamp: new Date(),
            ipAddress: userInfo?.ip || 'unknown',
            city: userInfo?.city || 'unknown',
            country: userInfo?.country || 'unknown'
        };
        
        await collection.insertOne(conversationData);
        console.log('Conversa salva no MongoDB');
    } catch (error) {
        console.error('Erro ao salvar conversa:', error);
    }
}

// Função para atualizar analytics
async function updateAnalytics(type, data = {}) {
    try {
        const collection = db.collection("analytics");
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const analyticsData = {
            date: today,
            type: type,
            count: 1,
            data: data,
            timestamp: new Date()
        };
        
        // Usar upsert para incrementar contador se já existir
        await collection.updateOne(
            { date: today, type: type },
            { 
                $inc: { count: 1 },
                $set: { timestamp: new Date() },
                $setOnInsert: { data: data }
            },
            { upsert: true }
        );
        
        console.log(`Analytics atualizado: ${type}`);
    } catch (error) {
        console.error('Erro ao atualizar analytics:', error);
    }
}

async function generateResponse(prompt, sessionId, userInfo) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: tools,
            systemInstruction: SYSTEM_INSTRUCTION
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
            
            // Executa a função (passa sessionId para getChatHistory)
            let functionResult;
            if (functionCall.name === 'getChatHistory') {
                functionResult = await functionToCall(functionArgs, sessionId);
            } else {
                functionResult = await functionToCall(functionArgs);
            }
            
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
            
            const finalResponse = resultFromFunctionCall.response.text();
            
            // Salvar conversa no MongoDB
            await saveConversation(sessionId, prompt, finalResponse, userInfo);
            
            // Atualizar analytics
            await updateAnalytics('function_call', { functionName: functionCall.name });
            
            return finalResponse;
        }
        
        const finalResponse = response.text();
        
        // Salvar conversa no MongoDB
        await saveConversation(sessionId, prompt, finalResponse, userInfo);
        
        // Atualizar analytics
        await updateAnalytics('message');
        
        return finalResponse;
    } catch (error) {
        console.error("Erro:", error);
        throw new Error("Erro ao processar a mensagem");
    }
}

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, sessionId, userInfo } = req.body;
        const finalSessionId = sessionId || generateSessionId();
        
        const response = await generateResponse(message, finalSessionId, userInfo);
        res.json({ 
            response,
            sessionId: finalSessionId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para obter informações do usuário
app.get('/api/user-info', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for']?.split(',').shift() || 
                  req.connection?.remoteAddress || 
                  req.socket?.remoteAddress || 
                  '127.0.0.1';
        
        if (!ip || ip === '127.0.0.1') {
            return res.json({
                ip: '127.0.0.1',
                city: 'Local',
                country: 'Local'
            });
        }

        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,city,query`);
        
        if (geoResponse.data.status === 'success') {
            res.json({
                ip: geoResponse.data.query,
                city: geoResponse.data.city,
                country: geoResponse.data.country,
            });
        } else {
            res.json({
                ip: ip,
                city: 'Desconhecida',
                country: 'Desconhecido'
            });
        }

    } catch (error) {
        console.error("[Servidor] Erro em /api/user-info:", error.message);
        res.json({
            ip: '127.0.0.1',
            city: 'Local',
            country: 'Local'
        });
    }
});

// Endpoint para registrar conexão
app.post('/api/log-connection', async (req, res) => {
    try {
        const { ip, city, country, timestamp } = req.body;

        if (!ip || !timestamp) {
            return res.status(400).json({ error: "Dados de log incompletos (IP e timestamp são obrigatórios)." });
        }

        const logEntry = {
            ipAddress: ip,
            city: city || 'Desconhecida',
            country: country || 'Desconhecido',
            connectionTime: new Date(timestamp),
            createdAt: new Date(),
            userAgent: req.headers['user-agent'] || 'Unknown'
        };

        const collection = db.collection("accessLogs");
        const result = await collection.insertOne(logEntry);

        // Atualizar analytics de conexão
        await updateAnalytics('connection', { city, country });

        console.log('[Servidor] Log de conexão salvo:', result.insertedId);
        res.status(201).json({ message: "Log de conexão salvo com sucesso!", logId: result.insertedId });

    } catch (error) {
        console.error("[Servidor] Erro em /api/log-connection:", error.message);
        res.status(500).json({ error: "Erro interno ao salvar log de conexão." });
    }
});

// Endpoint para obter histórico de conversas
app.get('/api/conversations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50 } = req.query;

        const collection = db.collection("conversations");
        const conversations = await collection
            .find({ sessionId })
            .sort({ timestamp: 1 })
            .limit(parseInt(limit))
            .toArray();

        res.json({ conversations });
    } catch (error) {
        console.error("Erro ao buscar conversas:", error);
        res.status(500).json({ error: "Erro ao buscar histórico de conversas" });
    }
});

// Endpoint para analytics (admin)
app.get('/api/analytics', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const analyticsCollection = db.collection("analytics");
        const conversationsCollection = db.collection("conversations");
        const accessLogsCollection = db.collection("accessLogs");

        // Analytics básicos
        const analytics = await analyticsCollection
            .find({ 
                timestamp: { $gte: startDate }
            })
            .sort({ date: -1 })
            .toArray();

        // Estatísticas gerais
        const totalConversations = await conversationsCollection.countDocuments({
            timestamp: { $gte: startDate }
        });

        const totalConnections = await accessLogsCollection.countDocuments({
            connectionTime: { $gte: startDate }
        });

        // Top cidades
        const topCities = await conversationsCollection.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).toArray();

        res.json({
            analytics,
            summary: {
                totalConversations,
                totalConnections,
                topCities
            }
        });
    } catch (error) {
        console.error("Erro ao buscar analytics:", error);
        res.status(500).json({ error: "Erro ao buscar analytics" });
    }
});

// Configure the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Export the Express API
export default app;

// Iniciar o servidor apenas se não estiver rodando no Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

