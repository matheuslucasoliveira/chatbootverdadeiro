document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Usar a URL do Render em produção
    const API_URL = window.location.origin;
    
    // Gerenciar sessão do usuário
    let sessionId = localStorage.getItem('chatSessionId');
    let userInfo = null;
    
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('chatSessionId', sessionId);
    }

    function generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function addMessage(message, isUser = false, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        
        // Adicionar timestamp se fornecido
        if (timestamp) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date(timestamp).toLocaleString('pt-BR');
            messageDiv.appendChild(timeDiv);
        }
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.id = 'typing-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<span class="typing-dots">●●●</span>';
        
        typingDiv.appendChild(contentDiv);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return typingDiv;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while processing
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add user message to chat
        addMessage(message, true, new Date());
        userInput.value = '';

        // Add typing indicator
        const typingIndicator = addTypingIndicator();

        try {
            // Send message to server
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    sessionId,
                    userInfo
                }),
            });

            if (!response.ok) {
                throw new Error('Erro na comunicação com o servidor');
            }

            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response
            addMessage(data.response, false, new Date());
            
            // Update session ID if provided
            if (data.sessionId && data.sessionId !== sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('chatSessionId', sessionId);
            }
            
        } catch (error) {
            console.error('Erro:', error);
            removeTypingIndicator();
            addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', false, new Date());
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    // Função para carregar histórico de conversas
    async function loadChatHistory() {
        try {
            const response = await fetch(`${API_URL}/api/conversations/${sessionId}?limit=20`);
            if (response.ok) {
                const data = await response.json();
                
                if (data.conversations && data.conversations.length > 0) {
                    // Limpar mensagens existentes
                    chatMessages.innerHTML = '';
                    
                    // Adicionar mensagens do histórico
                    data.conversations.forEach(conv => {
                        addMessage(conv.userMessage, true, conv.timestamp);
                        addMessage(conv.botResponse, false, conv.timestamp);
                    });
                    
                    console.log(`Carregado histórico de ${data.conversations.length} conversas`);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    // Função para limpar histórico
    function clearHistory() {
        if (confirm('Tem certeza que deseja limpar o histórico de conversas?')) {
            chatMessages.innerHTML = '';
            sessionId = generateSessionId();
            localStorage.setItem('chatSessionId', sessionId);
            addMessage('Olá! Sou o GeminiBot. Como posso ajudá-lo hoje?', false, new Date());
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Adicionar botão para limpar histórico
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Limpar Histórico';
    clearButton.className = 'clear-history-btn';
    clearButton.onclick = clearHistory;
    
    // Inserir botão antes do chat
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.insertBefore(clearButton, chatContainer.firstChild);
    }

    // Focus input on load
    userInput.focus();
    
    // Carregar histórico ao inicializar
    loadChatHistory().then(() => {
        // Se não há histórico, mostrar mensagem de boas-vindas
        if (chatMessages.children.length === 0) {
            addMessage('Olá! Sou o GeminiBot. Como posso ajudá-lo hoje?', false, new Date());
        }
    });
});

// Função para registrar conexão do usuário
async function registrarConexaoUsuario() {
    try {
        // 1. Obter informações do usuário (IP, Cidade) do nosso backend
        const userInfoResponse = await fetch(`${window.location.origin}/api/user-info`);
        if (!userInfoResponse.ok) {
            console.error("Falha ao obter user-info:", await userInfoResponse.text());
            return;
        }
        const userInfoData = await userInfoResponse.json();

        if (userInfoData.error) {
            console.error("Erro do servidor ao obter user-info:", userInfoData.error);
            return;
        }
        
        // Armazenar informações do usuário globalmente
        window.userInfo = userInfoData;
        
        // 2. Enviar log para o backend
        const logData = {
            ip: userInfoData.ip,
            city: userInfoData.city,
            country: userInfoData.country,
            timestamp: new Date().toISOString()
        };

        const logResponse = await fetch(`${window.location.origin}/api/log-connection`, {
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

