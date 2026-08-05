# V21 — cronômetro nas últimas 24 horas

Comportamento:
- acima de 24 horas: mostra dias faltando;
- 24 horas ou menos, com horário exato: mostra HH:MM:SS;
- ao alcançar o horário: mostra AGORA;
- eventos sem horário exato continuam mostrando HOJE;
- usa sempre o fuso America/Sao_Paulo;
- reconhece formatos como 20h, 13h15, 14h–15h30 e 10:30–11:30.

Esta versão altera somente o site. Não é necessário mexer no Apps Script.

Publicação:
1. Substituir no GitHub: index.html, eventos.json, manifest.webmanifest e icon.svg.
2. Abrir:
https://ycz5zpbzds-cpu.github.io/Calend-rio-6P-2026-02/?build=21
