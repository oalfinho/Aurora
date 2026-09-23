# Aurora no VSCode

Esta versão é local e não depende de serviços externos de hospedagem, banco ou deploy.

## Abrir e rodar

1. Abra a pasta no VSCode.
2. Use Node.js 22.13 ou superior.
3. No terminal:

       npm install
       npm run dev

## Trocar quadrados por bolas

A configuração fica no começo de app/page.tsx:

       const MAP_HISTORY_SHAPE: 'circle' | 'square' = 'circle';

Use circle para círculos ou square para quadrados.

No modo circular, o tamanho da bola cresce de acordo com a quantidade de registros da área. A fórmula usa:

       radius: Math.max(180, Math.min(820, 160 + count * 12))

160 controla o tamanho mínimo, 12 controla o crescimento por registro e 820 limita o tamanho máximo.

Para todas as bolas terem o mesmo tamanho, use:

       radius: 450

## Arquivos principais

- app/page.tsx: mapa, filtros, alertas e chatbot guiado.
- app/globals.css: visual responsivo.
- data/aurora.json: dados agregados filtrados para Rio Claro.
- data/reports.json: relatos pendentes salvos localmente; é criado quando o primeiro relato é enviado.
- public/vendor/leaflet.js e leaflet.css: Leaflet usado pelo mapa.
- scripts/prepare_data.py: reprocessamento dos arquivos originais, se necessário.

O projeto não inclui node_modules. Rode npm install depois de abrir a pasta.
