# Aurora — MVP Rio Claro

Aplicação local com mapa interativo, pesquisa de percepção e assistente guiado para receber relatos sem campos identificadores.

## Dados

- scripts/prepare_data.py extrai o objeto JSON embutido no trabalho fornecido e filtra exatamente RIO CLARO.
- Resultado: 673 registros de violência doméstica, 2 de feminicídio e 8 de tentativa; soma 683, não vítimas únicas.
- Mapa: 533 registros em 37 células de 0,01 grau; 84 rurais artificialmente posicionados, 42 sem coordenada e 24 em células pequenas ficam apenas nos totais.
- Os nomes de células usam o bairro com maior contribuição, seguido de “e arredores”; não são polígonos de bairros oficiais.
- Período de comunicação: jan/2025–abr/2026 conforme nota do HTML. Datas de fatos podem ser anteriores.
- Pesquisa: 51 respostas, 10–18/09/2026. Apenas contagens agregadas são distribuídas; respostas individuais não integram o projeto.

## Relatos

O chatbot é um fluxo de escolhas, sem LLM e sem texto livre. POST /api/relatos valida os campos e grava localmente em data/reports/<UUID>.json com status pending. UUID garante idempotência. Cada envio é publicado atomicamente em um arquivo separado para evitar perda em gravações simultâneas; o arquivo legado data/reports.json continua sendo consultado para deduplicação. O servidor não armazena IP, nome, contato, coordenadas individuais ou cookies de identificação no registro.

Não há moderação operacional nem publicação comunitária neste MVP. Os relatos ficam pendentes para revisão local.

## Alertas

Geolocation watchPosition, consentimento explícito no navegador e cálculo no cliente. A proximidade é calculada até 1,2 km do centro de uma célula histórica exibida. Precisão pior que 500m suspende o alerta. Funciona com a página ativa e não promete notificações em segundo plano ou rotas seguras.

## Desenvolvimento

Requer Node 22 ou superior.

    npm install
    npm run dev

Para produção local:

    npm run build
    npm run start

Esta versão é local e não depende de serviços externos de hospedagem, banco ou configuração de deploy.

## Fontes externas

- Mapa: OpenStreetMap, https://www.openstreetmap.org/copyright
- Política de tiles: https://operations.osmfoundation.org/policies/tiles/
- Canais de apoio: https://www.gov.br/mulheres/pt-br/ligue180
- Leaflet embutido no projeto.

## Mapa, mobile e assistente

- Zoom limitado entre 11 e 16, com navegação restrita ao limite municipal e uma margem de 12%. O botão de centralizar retorna ao centro urbano.
- Interface responsiva: no celular, o chat começa fechado e pode ser aberto pelo botão fixo “Registrar relato”. Quando aberto, aparece antes do mapa. O mapa se ajusta automaticamente a mudanças de tamanho.
- Categorias de relato têm cor, ícone e mensagem próprios. Os filtros históricos também atualizam cores de áreas e legenda; os dados continuam agregados.
- Quatro etapas: situação, região, período e revisão. É possível voltar, corrigir e recomeçar; o envio exige consentimento e mês válido. Falhas e timeout preservam as escolhas e permitem repetir o envio com o mesmo protocolo.
- O assistente é guiado por escolhas, sem LLM ou texto livre. Não publica relatos automaticamente nem atende emergências.
- A persistência exige servidor Node com disco gravável e persistente. Hospedagens com disco efêmero ou várias instâncias precisam de banco compartilhado antes de uso real.

Para testar no celular na mesma rede: `npm run dev -- --hostname 0.0.0.0` e abra `http://IP-DO-COMPUTADOR:3000`. Alertas por geolocalização exigem HTTPS fora de localhost.

Validação da API: execute `npm run build` e depois `node scripts/test-reports.mjs`. O teste inicia um servidor local e remove apenas os relatos de teste que ele próprio criou.
