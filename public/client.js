document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Usar a URL do Render em produção
    const API_URL = window.location.origin;

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while processing
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';

        try {
            // Send message to server
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Erro na comunicação com o servidor');
            }

            const data = await response.json();
            addMessage(data.response);
        } catch (error) {
            console.error('Erro:', error);
            addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Focus input on load
    userInput.focus();
});

// Função para registrar conexão do usuário
async function registrarConexaoUsuario() {
    try {
        // 1. Obter informações do usuário (IP, Cidade) do nosso backend
        const userInfoResponse = await fetch(`${API_URL}/api/user-info`);
        if (!userInfoResponse.ok) {
            console.error("Falha ao obter user-info:", await userInfoResponse.text());
            return; // Não prossegue se não conseguir IP/cidade
        }
        const userInfo = await userInfoResponse.json();

        if (userInfo.error) {
            console.error("Erro do servidor ao obter user-info:", userInfo.error);
            return;
        }
        
        // 2. Enviar log para o backend
        const logData = {
            ip: userInfo.ip,
            city: userInfo.city,
            timestamp: new Date().toISOString() // Padrão ISO 8601 para data/hora
        };

        const logResponse = await fetch(`${API_URL}/api/log-connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        });

        if (!logResponse.ok) {
            console.error("Falha ao enviar log de conexão:", await logResponse.text());
        } else {
            const result = await logResponse.json();
            console.log("Log de conexão enviado:", result.message);
        }

    } catch (error) {
        console.error("Erro ao registrar conexão do usuário:", error);
    }
}

// Chamar esta função quando a página carregar
window.addEventListener('load', registrarConexaoUsuario); 