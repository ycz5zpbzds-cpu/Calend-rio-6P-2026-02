# V18 — sem chave e ícone global

## Mudanças
- não pede chave em nenhum aparelho;
- conecta automaticamente ao Apps Script;
- permite escolher PNG, JPG, WEBP ou SVG no próprio site;
- converte o ícone para PNG 512 × 512;
- envia o arquivo ao Google Drive;
- salva o endereço na aba Configuracoes;
- sincroniza favicon e ícone usado em novas instalações;
- mantém icon.svg como fallback.

## Publicação
1. Substitua o código do Apps Script pelo arquivo V18.
2. Execute a função setupV18 e autorize o acesso ao Google Drive.
3. Atualize a implantação para uma nova versão.
4. Envie ao GitHub: index.html, eventos.json, manifest.webmanifest e icon.svg.
5. Abra:
   https://ycz5zpbzds-cpu.github.io/Calend-rio-6P-2026-02/?build=18

## Segurança
Esta versão não tem autenticação. Qualquer pessoa que descubra o endereço /exec
pode alterar eventos, configurações e o ícone.

## iPhone/iPad
O ícone de um atalho já instalado pode ficar em cache. Remova o atalho antigo
e adicione novamente pelo Safari depois de trocar o ícone.
