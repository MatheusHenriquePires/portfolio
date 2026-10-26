# Matheus Henrique — Portfólio

Next.js App Router, TypeScript, Tailwind CSS e Framer Motion. Identidade baseada no Figma, evoluída para cases de **Arena Replay, Gênesis, Arbóreo CRM, JusRadar e Liga Pé de Porco**, com arquitetura de sistemas em perspectiva no lugar de formas abstratas.

## Rodar localmente

Requer Node.js 20.9+ e npm. Ambiente validado com Node 24.

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:3000.

## Comandos

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`npm run build` gera as páginas estáticas, incluindo os cinco cases. Fontes variáveis locais com `next/font/local`: o build não precisa acessar Google Fonts.

Com o servidor ativo e Google Chrome instalado:

```sh
node scripts/check-site.mjs
```

Valida sete rotas em 1440, 768, 390 e 320 px, acessibilidade com axe, menu, links dos cases, formulário, clipboard, páginas inválidas, sitemap, Open Graph, conteúdo sem JavaScript e movimento reduzido. Relatório e screenshots ficam em `.local/`, fora do controle de versão. Para outro servidor, configure `TEST_BASE_URL`.

## Onde editar

```text
app/                         Rotas, metadata, sitemap, robots, imagem social
  projetos/[slug]/           Cases pré-renderizados
components/
  layout/                    Navbar, Footer e SiteShell
  ui/                        Button, SectionLabel, SectionTitle, Reveal, SystemVisual
  home/                      Hero, projetos, capacidades e apresentação
  project/                   ProjectCard e CaseLayout
  contact/                   Formulário de contato
data/
  projects.ts                Conteúdo e impactos dos projetos
  site.ts                    Configuração do site e opções de ambiente
  profile.ts                 Perfil, contato, experiências, formação e currículo
lib/motion.ts                Configuração do reveal
styles/
  tokens.css                 Cores, espaçamentos, raios e integração Tailwind
  globals.css                Layout e responsividade
  systems.css                Módulos 3D, terminais e conexões
docs/design-notes.md         Referências do Figma e decisões de adaptação
```

Adicione um objeto em `data/projects.ts` para criar um projeto. O card, rota, próximo projeto e sitemap passam a usar os novos dados automaticamente. `visual` seleciona uma das variantes de arquitetura em `SystemVisual.tsx`; novas variantes podem ser acrescentadas ali.

Cada case contém hero, contexto, problema, atuação, solução, detalhamento técnico, impacto, funcionamento, stack e próximo projeto. Aprendizados são exibidos quando há conteúdo confirmado. A autoria integral de Gênesis e Arena Replay foi confirmada pelo autor; o case Gênesis foi atualizado a partir do código-fonte local (IA, simulados, SSO e testes). O uso do Arbóreo CRM em produção foi confirmado pelo autor. Não foram usados números de impacto fictícios. Os visuais dos cases são representações conceituais, não capturas de produtos reais.

## Grade de projetos

`components/project/ProjectGrid.tsx` filtra os cards por tecnologia (a partir de `tags` e `technologies`) e por `status: "production"`. Projetos com `featured` ocupam a linha inteira; se sobrar um card sozinho no fim, ele também se expande. Em repouso, o card mostra a arquitetura conceitual em CSS. A cena WebGL só é montada no hover ou foco do card (no desktop, o destaque a mantém enquanto visível), e nunca em telas de toque. No hover, o `flow` do projeto é percorrido etapa por etapa.

## Contato

E-mail, GitHub e LinkedIn vêm de `data/profile.ts`, preenchido a partir do currículo fornecido. O formulário valida os campos e abre o aplicativo de e-mail com o texto preenchido. Nenhuma mensagem é enviada automaticamente e os dados do formulário não são armazenados.

Para substituir o e-mail do perfil, configure `NEXT_PUBLIC_CONTACT_EMAIL` e reinicie/recompile. Não há serviço de envio de e-mail no servidor.

O botão “Meu currículo”, na Home e em Sobre, abre `/documentos/curriculo-matheus-pires.pdf` em nova aba. Para atualizar o documento, substitua o arquivo em `public/documentos/`. Os dados profissionais do site podem ser editados em `data/profile.ts`.

## Publicação

O projeto está pronto para um serviço que execute Next.js ou um servidor Node:

```sh
npm ci
npm run build
npm start -- --hostname 0.0.0.0
```

Configure `NEXT_PUBLIC_SITE_URL` com o domínio real antes do build para gerar canonical URLs e sitemap corretos. As demais opções públicas estão em `.env.example`. Não há segredos ou banco de dados necessários para o portfólio. Nenhum deploy foi realizado.

## Acessibilidade e movimento

Os textos e dados dos projetos ficam em `data/projects.ts`; o perfil profissional fica em `data/profile.ts`. As configurações dos objetos visuais ficam em `data/visuals.ts`. Home usa uma arquitetura com brackets; Sobre combina terminal e stack; Contato apresenta um hub profissional. Os cases têm representações próprias do fluxo de cada sistema.

O objeto interativo da Home é `components/visual/DeveloperCore.tsx`, com conteúdo em `data/developer-core.ts`. Seus símbolos podem ser selecionados por clique, toque ou teclado; Escape fecha os detalhes. Arraste horizontal gira a estrutura e o scroll da página separa os módulos sem bloquear a navegação. O núcleo abre um terminal demonstrativo por alguns segundos. A profundidade é simulada com CSS/SVG, sem WebGL ou modelos externos.

As primitivas `CodeSymbol3D`, `SystemModule3D`, `DataFlowLine` e `TerminalPanel` ficam em `components/visual/`. `ImpactStat`, `CaseHero`, `CaseSection` e `ContactPanel` compartilham a apresentação de resultados, cases e contato. Os visuais são representações conceituais, e não capturas das aplicações.

HTML semântico, idioma pt-BR, skip link, foco visível, menu com Escape e estado expandido, formulários rotulados, validação nativa e região de status. Conteúdo permanece no HTML sem JavaScript. Visuais conceituais são ocultados de leitores de tela e seus fluxos são descritos em texto nos cases.

Reveals executam uma vez; animações dos módulos pausam fora da viewport. `prefers-reduced-motion` desativa os movimentos, pacotes animados e transições. Parallax apenas com mouse. Sem Three.js, canvas contínuo ou imagens de tela rasterizadas.

## Informações ainda a completar

- Aprendizados e próximos passos específicos de cada projeto.
- Métricas reais de impacto, quando disponíveis.

O case do Arena Replay foi descrito a partir do código-fonte e do README do projeto (repositório privado) e dos sites públicos replaybrasil.online e arenaff.replaybrasil.online.

Arbóreo CRM (repositório privado) e Liga Pé de Porco (repositório público) foram descritos a partir do código e dos READMEs. A Liga não tem endereço público ativo; o case aponta para o repositório.

JusRadar foi descrito a partir de seu repositório público; a versão consultada contém conflitos de merge. Não foi executado nem validado como produto em produção.

## Dependências

A auditoria de produção (`npm audit --omit=dev`) não reportou vulnerabilidades na entrega. A auditoria completa reportou cinco alertas na cadeia de ferramentas de lint (`eslint-config-next → fast-glob → micromatch → braces`). O npm propõe downgrade incompatível do preset do Next; não foi aplicado `audit fix --force`. Essa cadeia não faz parte do runtime do site.
