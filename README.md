# V20 — cores automáticas e contagem estável

Correções:
- a API informa a versão real; o site avisa quando a implantação está antiga;
- cores e emojis são salvos automaticamente, sem depender do botão;
- cada alteração salva somente a configuração modificada;
- configuração global sempre prevalece sobre cores locais antigas;
- outros aparelhos verificam mudanças a cada 15 segundos;
- ao voltar para a aba ou reabrir o site, sincroniza imediatamente;
- contagem usa exclusivamente a data de São Paulo;
- dia 5 para evento dia 6 = 1 dia;
- evento no próprio dia = HOJE;
- não usa horário nem cronômetro.

Publicação:
1. Cole o Apps Script V20.
2. Execute setupV20.
3. Em Gerenciar implantações, selecione Nova versão e implante.
4. Substitua no GitHub index.html, eventos.json, manifest.webmanifest e icon.svg.
5. Abra com ?build=20.
