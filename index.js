import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { MongoClient, ServerApiVersion } from 'mongodb';

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
let db; // Variável para guardar a referência do banco

// Função para conectar ao MongoDB
async function connectDB() {
    if (db) return db; // Se já conectado, retorna a instância
    if (!mongoUri) {
        console.error("MONGO_URI não definida no .env!");
        process.exit(1); // Encerra se não tiver URI
    }
    const client = new MongoClient(mongoUri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    try {
        await client.connect();
        db = client.db("ifcodeLogsDB"); // Especifique o nome do seu banco de dados aqui
        console.log("Conectado ao MongoDB Atlas!");
        return db;
    } catch (err) {
        console.error("Falha ao conectar ao MongoDB:", err);
        process.exit(1);
    }
}

// Chamar a função para conectar quando o servidor inicia
connectDB();

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
app.use(express.static(path.join(__dirname, 'public')));

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
const SYSTEM_INSTRUCTION = `Você é um assistente amigável e prestativo chamado GeminiBot. 
Sua personalidade é:
- Amigável e acolhedor
- Respostas concisas e diretas
- Usa linguagem simples e acessível
- Mantém um tom profissional mas descontraído
- Sempre tenta ajudar da melhor forma possível
- Quando perguntado sobre data e hora, fornece a informação atual de forma clara e amigável`;

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

// Endpoint para obter informações do usuário
app.get('/api/user-info', async (req, res) => {
    try {
        // Tenta obter o IP do header x-forwarded-for (comum em proxies como o do Render)
        // ou diretamente do req.socket.remoteAddress
        const ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
        
        if (!ip) {
            return res.status(400).json({ error: "Não foi possível determinar o endereço IP." });
        }

        // Chamada para ip-api.com (não precisa de chave para o básico)
        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,city,query`);
        
        if (geoResponse.data.status === 'success') {
            res.json({
                ip: geoResponse.data.query, // O IP que foi consultado
                city: geoResponse.data.city,
                country: geoResponse.data.country,
            });
        } else {
            res.status(500).json({ error: geoResponse.data.message || "Erro ao obter geolocalização." });
        }

    } catch (error) {
        console.error("[Servidor] Erro em /api/user-info:", error.message);
        res.status(500).json({ error: "Erro interno ao processar informações do usuário." });
    }
});

// Endpoint para registrar conexão
app.post('/api/log-connection', async (req, res) => {
    if (!db) { // Garante que o DB está conectado
        await connectDB();
        if (!db) return res.status(500).json({ error: "Servidor não conectado ao banco de dados." });
    }

    try {
        const { ip, city, timestamp } = req.body; // Pega dados do corpo da requisição

        if (!ip || !city || !timestamp) {
            return res.status(400).json({ error: "Dados de log incompletos (IP, cidade, timestamp são obrigatórios)." });
        }

        const logEntry = {
            ipAddress: ip,
            city: city,
            connectionTime: new Date(timestamp), // Converte string de timestamp para objeto Date
            createdAt: new Date() // Data de criação do registro no DB
        };

        const collection = db.collection("accessLogs"); // Nome da sua coleção no MongoDB
        const result = await collection.insertOne(logEntry);

        console.log('[Servidor] Log de conexão salvo:', result.insertedId);
        res.status(201).json({ message: "Log de conexão salvo com sucesso!", logId: result.insertedId });

    } catch (error) {
        console.error("[Servidor] Erro em /api/log-connection:", error.message);
        res.status(500).json({ error: "Erro interno ao salvar log de conexão." });
    }
});

// Export the Express API
export default app;

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 