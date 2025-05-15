import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

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

// Export the Express API
export default app;

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 