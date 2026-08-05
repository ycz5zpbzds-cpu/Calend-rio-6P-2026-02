# V17 — reconexão persistente

Correções:
- a chave permanece salva no localStorage;
- o campo da chave continua vazio por segurança, mas mostra que ela já está salva;
- após atualizar a página, o site tenta reconectar automaticamente até três vezes;
- falhas temporárias não fazem o site pedir a chave novamente;
- o botão vira “Reconectar agora” quando já há uma chave salva;
- erros silenciosos agora aparecem corretamente no painel.

Não é necessário alterar o Apps Script para esta versão.

Abra após publicar:
https://ycz5zpbzds-cpu.github.io/Calend-rio-6P-2026-02/?build=17
