import "./style.css";

document.querySelector("#app").innerHTML = `
  <div class="chat-container">
    <form class="message-form" action="#">
      <div id="resposta-container">
        <div id="resposta">
          <div class="message-usuario"><span>Fala meu parceiro!</span></div>
          <div class="message"><span>E aí, gamer! Pronto pra falar de jogos? Qual é o seu vício do momento? Me conta tudo! 👾🎮🕹️</span></div>
        </div>
      </div>
      <textarea></textarea>
      <button type="submit">Enviar</button>
    </form>
  </div>
`;
