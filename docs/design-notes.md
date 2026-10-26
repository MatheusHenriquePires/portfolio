# Referência e decisões

Arquivo: https://www.figma.com/design/aN7o2CTsphsKBipWmSnvvz

- Home: `6:22` — 03 / Home Full Desktop
- Case: `6:105` — Arena Replay
- Sobre: `6:170`
- Contato: `6:215`
- Identidade: `3:12`

Analisados via Figma MCP: hierarquia, contexto de implementação e screenshots das cinco referências.

## Identidade

INK #0B0D10, PAPER #F4F4EF, ACID #C8FF32, VIOLET #7B61FF e CYBER #6BE7FF. Sora em títulos, Manrope em textos, Space Grotesk em labels. Grid de referência: 1440 px, margens de 64 px. Home e Sobre escuros; cases e Contato claros conforme suas telas.

## Adaptações intencionais

- Caixas de texto de 10 px de altura, recortes de conteúdo, fundos brancos de grupos e sobreposição do rodapé são defeitos presentes na referência. No site, os textos usam altura automática e o layout segue o fluxo do documento.
- Visuais de arquitetura com módulos 3D, conexões SVG, pacotes de dados e terminal. O usuário substituiu explicitamente os orbs abstratos por representações de sistemas. Nenhuma imagem de tela rasterizada, nenhuma dependência de assets temporários do Figma ou Three.js.
- Direcionamento final: projetos orientados a impacto, remoção de Student Sync, alteração de QFUND para Genesis e substituição de Simulados ENEM por JusRadar. Depois, inclusão de Arbóreo CRM e Liga Pé de Porco: cinco cards. A grade mantém duas colunas no desktop; o último card, ímpar, ocupa uma linha com composição horizontal.
- Métricas numéricas não confirmadas não são publicadas. As afirmações funcionais vêm do Figma, do currículo e das descrições do usuário, com prioridade para suas correções. Autoria integral de Gênesis e Arena Replay confirmada pelo autor. O case Gênesis foi ampliado com a documentação técnica fornecida; conteúdos não confirmados são omitidos.
- Mobile usa menu expansível, arquitetura abaixo do texto, cards em coluna única, impactos em linhas e fluxos verticais nos cases.

## Estrutura

`app/` rotas e metadata; `components/layout/` moldura e navegação; `components/ui/` primitivas visuais; `components/home/` seções; `components/project/` cards e case; `components/contact/` formulário; `data/` conteúdo; `lib/` movimento; `styles/` tokens e estilos.

## Fonte do JusRadar

Repositório público: https://github.com/MatheusHenriquePires/Jusradar

Consultados via API do GitHub: README, árvore de arquivos, `frontend/package.json`, `MonitoramentoScheduler.java` e `DataJudClient.java`. Stack confirmada: Java 21, Spring Boot, PostgreSQL, Flyway, JWT, OpenAPI, React e Vite. O código inclui rotina de monitoramento agendada, mas também conflitos de merge em DataJudClient. O portfólio descreve o projeto sem afirmar implantação em produção, usuários atendidos ou resultados medidos. Não houve alteração no repositório externo.
