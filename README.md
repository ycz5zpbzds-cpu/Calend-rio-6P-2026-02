# V19 — sincronização corrigida

Correções:
- configurações globais não são mais gravadas na aba Configuracoes;
- cores, emojis e ícone são guardados nas Propriedades do Apps Script;
- evita o erro de ações no nível da coluna causado pelas Tabelas do Google Planilhas;
- datas novas são gravadas como dd/MM/yyyy sem alterar a formatação da coluna;
- botões ficam bloqueados durante a gravação para impedir eventos duplicados;
- falha de atualização depois de uma gravação não faz o site afirmar que a gravação falhou;
- outros aparelhos verificam mudanças a cada 30 segundos;
- ao voltar para o site no celular, ele sincroniza imediatamente.

Publicação:
1. Substituir o Apps Script pelo arquivo V19.
2. Executar setupV19.
3. Criar nova versão da implantação existente.
4. Substituir no GitHub: index.html, eventos.json, manifest.webmanifest e icon.svg.
5. Abrir com ?build=19.
