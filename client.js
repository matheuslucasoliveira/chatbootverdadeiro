document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    const API_URL = window.location.origin;

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${isUser ? "user" : "bot"}`;

        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.textContent = message;

        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function fetchUserIp() {
        try {
            // Simula a obtenção do IP do usuário. Em um cenário real, você faria uma requisição a um serviço.
            // Por exemplo, para um endpoint no seu próprio backend que retorna o IP do cliente.
            // const response = await fetch(`${API_URL}/api/user-info`);
            // const data = await response.json();
            // return data.ip;
            return "192.168.1.1"; // IP de exemplo para simulação
        } catch (error) {
            console.error("Erro ao obter IP do usuário:", error);
            return "IP_Desconhecido";
        }
    }

    async function logUserConnection(acao) {
        const ip = await fetchUserIp();
        try {
            await fetch(`${API_URL}/api/log-connection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ip, acao }),
            });
            console.log(`Log de conexão (${acao}) enviado com sucesso.`);
        } catch (error) {
            console.error("Erro ao enviar log de conexão:", error);
        }
    }

    async function registrarAcessoBotParaRanking(botId, nomeBot) {
        try {
            const dataRanking = {
                botId: botId,
                nomeBot: nomeBot,
                timestampAcesso: new Date().toISOString(),
            };

            await fetch(`${API_URL}/api/ranking/registrar-acesso-bot`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataRanking),
            });
            console.log(`Acesso ao bot ${nomeBot} registrado para ranking.`);
        } catch (error) {
            console.error("Erro ao registrar acesso ao bot para ranking:", error);
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        userInput.disabled = true;
        sendButton.disabled = true;

        addMessage(message, true);
        userInput.value = "";

        // Log da ação do usuário ao enviar mensagem
        await logUserConnection("enviou_mensagem");

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error("Erro na comunicação com o servidor");
            }

            const data = await response.json();
            addMessage(data.response);
        } catch (error) {
            console.error("Erro:", error);
            addMessage("Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.");
        } finally {
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener("click", sendMessage);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Log inicial de acesso ao chatbot e registro para ranking
    logUserConnection("acesso_inicial_chatbot");
    registrarAcessoBotParaRanking("chatbot_principal", "Chatbot Principal");

    userInput.focus();
});


