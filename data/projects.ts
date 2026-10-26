export type SystemVariant = "architecture" | "arena-replay" | "genesis" | "jusradar" | "arboreo" | "liga";

export type Project = {
  number: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  visual: SystemVariant;
  screenshots?: { src: string; alt: string; title: string; description: string; width: number; height: number }[];
  category: string;
  impacts: { value: string; label: string }[];
  context: string;
  contribution?: string;
  technicalDetails: { title: string; body: string }[];
  deliveryNote?: string;
  solution: string;
  learnings?: string;
  repository?: string;
  website?: string;
  /** Sistema publicado e em uso; ganha selo e entra no filtro "Em produção". */
  status?: "production";
  /** Card largo no topo da grade. */
  featured?: boolean;
  technologies?: string[];
  summary?: string;
  role?: string;
  year?: string;
  focus?: string;
  problem?: { title: string; body: string };
  flow?: string[];
  result?: { title: string; items: { title: string; body: string }[] };
};

export const projects: Project[] = [
  {
    number: "01", slug: "arena-replay", title: "Arena Replay",
    visual: "arena-replay",
    status: "production", featured: true,
    category: "Sistema web / Esporte",
    role: "Desenvolvimento integral",
    contribution: "Desenvolvi o Arena Replay de ponta a ponta: o agente em Python que roda no computador da arena, a plataforma web em Next.js e TypeScript, o banco PostgreSQL, o armazenamento no Cloudflare R2 e o deploy no Railway. Também implementei o painel administrativo, o portal do dono da arena, a política de retenção e os testes automatizados do agente e do backend.",
    impacts: [{ value: "Em produção", label: "na Arena FF, em Teresina" }, { value: "2 quadras", label: "capturadas pelo mesmo agente" }, { value: "Offline", label: "a gravação continua sem internet" }],
    context: "Em uma arena esportiva, o melhor lance da partida acontece e se perde. O Arena Replay conecta as câmeras da quadra a uma galeria na web: o atleta aperta um botão e os últimos segundos do jogo viram um vídeo que ele pode assistir, baixar e compartilhar. O sistema está publicado em replaybrasil.online e opera na Arena FF.",
    technicalDetails: [
      { title: "Agente na arena", body: "Um programa em Python roda no computador da arena e mantém um processo FFmpeg por quadra lendo o DVR via RTSP. O vídeo é normalizado para H.264 e gravado em segmentos de um segundo, formando um buffer circular. Quando o botão é acionado, o agente fixa a janela de 15 segundos antes e 5 depois, protege esses segmentos contra limpeza e exporta o MP4. Até quatro exportações rodam em paralelo, e o agente rejeita novos replays quando o espaço em disco fica abaixo do limite." },
      { title: "Botão físico e entrada", body: "O botão é um controle USB Zero Delay lido como joystick: via evdev no Linux e como joystick no Windows. Cada código de botão é mapeado para uma quadra em um arquivo de configuração. Apenas o evento de pressão dispara o replay, com cooldown por botão; a desconexão USB é detectada e a leitura é retomada automaticamente." },
      { title: "Fila offline e upload", body: "Cada replay entra em uma fila SQLite com os estados pendente, enviando, enviado e falhou. Falhas são repetidas com espera progressiva de 2 a 256 segundos, sem apagar o arquivo local, e a fila é recuperada após reinício. Um arquivo JSON auxiliar acompanha cada MP4 para recuperar o registro se o processo cair entre a exportação e a gravação no banco. IDs persistentes tornam o reenvio idempotente." },
      { title: "Plataforma web e armazenamento", body: "O backend em Next.js e TypeScript recebe os metadados, autentica cada agente por token vinculado à sua arena e emite uma URL pré-assinada para o agente enviar o vídeo direto a um bucket privado do Cloudflare R2. Ao concluir, o servidor confirma no R2 que o objeto existe, é MP4 e respeita o limite de tamanho. A galeria entrega cada vídeo por um link assinado de uma hora." },
      { title: "Multi-arena e portal do dono", body: "O PostgreSQL guarda arenas, quadras, câmeras, agentes e replays, com migrações versionadas. Cada arena tem um subdomínio próprio, como arenaff.replaybrasil.online, com galeria pública e um portal do dono somente leitura. Os papéis proprietário, gerente e consulta definem o acesso a replays, equipamento e financeiro, e cada consulta é filtrada pela arena do vínculo." },
      { title: "Operação e segurança", body: "O painel administrativo mostra os agentes conectados por heartbeat e marca a arena como atenção quando o sinal para, uma câmera cai ou há uploads com falha. O login tem limite de tentativas por e-mail e por IP, e as sessões são revogáveis no servidor. Um job de retenção remove os vídeos expirados do R2 antes de expirar o registro no banco. O agente é distribuído como executável via PyInstaller e roda como serviço systemd no Linux." },
    ],
    solution: "Separei o sistema em duas partes. Na arena, um agente em Python captura as duas quadras continuamente, gera o MP4 quando o botão é acionado e mantém uma fila de envio que sobrevive a quedas de internet. Na nuvem, uma plataforma Next.js autoriza os uploads diretos para o Cloudflare R2, registra os replays no PostgreSQL e os publica na galeria da arena, com painel administrativo e portal do dono.",
    description: "Sistema de replays para arenas esportivas em produção: um botão na quadra transforma os últimos segundos do jogo em vídeo na galeria da arena.",
    tags: ["Python", "Next.js", "FFmpeg", "PostgreSQL"],
    technologies: ["Python 3.12", "FFmpeg", "SQLite", "evdev", "PyInstaller", "Next.js", "TypeScript", "React", "PostgreSQL", "Cloudflare R2", "Zod", "Docker", "Railway", "systemd"],
    summary: "Sistema de replay para quadras esportivas em produção. Um agente na arena grava as câmeras continuamente; quando o botão é acionado, o lance vira um vídeo publicado na galeria da arena.",
    year: "2026", focus: "Replay esportivo",
    website: "https://replaybrasil.online/",
    problem: {
      title: "Salvar o lance no momento em que ele acontece, mesmo com rede instável.",
      body: "O replay precisa conter os segundos anteriores ao acionamento, o que exige gravar continuamente sem encher o disco. O computador da arena depende de uma conexão que pode cair, e cada arena precisa ver apenas os próprios vídeos. O sistema também precisava permitir acompanhar a captura de cada arena à distância.",
    },
    flow: ["Câmera", "Buffer", "Botão", "MP4", "Fila", "R2", "Galeria"],
    result: {
      title: "O atleta aperta o botão e encontra o lance na galeria da arena.",
      items: [
        { title: "Ação simples", body: "Um toque na quadra guarda os últimos segundos." },
        { title: "Resiliência", body: "A captura e a geração continuam sem internet; o envio é retomado depois." },
        { title: "Operação remota", body: "O painel mostra agentes, câmeras e uploads de cada arena." },
      ],
    },
    learnings: "A decisão central foi manter o vídeo na arena até o upload estar confirmado: a captura não depende da internet, e a nuvem só recebe arquivos completos. O upload direto ao R2 por URL pré-assinada evita que o servidor web carregue vídeos. Entre os limites conhecidos do MVP estão a precisão do instante do botão, aproximada pela progressão do FFmpeg e sujeita à latência do DVR, e a retenção dos MP4 locais na arena, que ainda depende de uma política definida na operação.",
  },
  {
    number: "02", slug: "genesis", title: "Gênesis",
    status: "production",
    screenshots: [
      { src: "/projects/genesis/login.png", width: 1440, height: 900, title: "Acesso com identidade KeepEdu", alt: "Tela de login do Gênesis com a marca QSetup e campos de e-mail e senha da KeepEdu.", description: "O usuário acessa a plataforma com as credenciais da KeepEdu. Desenvolvi a integração de autenticação e a gestão de sessões no backend, evitando um cadastro de senha separado.", },
      { src: "/projects/genesis/home.png", width: 1440, height: 900, title: "Configuração da atividade", alt: "Gerador de atividades com seleção de série, disciplina, quantidade, dificuldade, tipo e conteúdos.", description: "A interface reúne os critérios de seleção das questões e apresenta as disciplinas e séries disponíveis. Desenvolvi o formulário e sua integração com a API para montar a atividade conforme os critérios do professor.", },
      { src: "/projects/genesis/history.png", width: 1440, height: 900, title: "Histórico e acompanhamento", alt: "Histórico de atividades com filtros, status pendente, dados do professor, controle de cópias e download de PDF.", description: "O histórico permite filtrar atividades, consultar seu status, baixar o PDF e acessar as movimentações. Implementei a persistência dos registros e o fluxo de aprovação e impressão com permissões por papel.", },
    ],
    visual: "genesis",
    category: "EdTech / Automação",
    role: "Desenvolvimento integral da plataforma",
    focus: "Gestão de atividades escolares",
    impacts: [{ value: "4 perfis", label: "com permissões por responsabilidade" }, { value: "IA", label: "na geração e revisão de questões" }, { value: "339 testes", label: "automatizados no backend e no navegador" }],
    context: "Preparar uma atividade escolar envolve mais do que selecionar questões. O professor precisa organizar o conteúdo, revisar o documento e encaminhá-lo à coordenação e à gráfica. Desenvolvi o Gênesis para reunir esse processo em uma aplicação com banco de questões próprio e integrada à identidade de usuários da KeepEdu.",
    contribution: "Desenvolvi todas as partes do Gênesis: interface web em React e TypeScript, backend em Python com FastAPI, persistência em MySQL/MariaDB e geração de PDFs com ReportLab. Implementei a integração com a KeepEdu, incluindo o SSO e o cadastro de simulados, a sincronização do catálogo, as permissões, a prévia editável, a geração e a revisão de questões com IA, o histórico com aprovação e impressão, os testes automatizados e o deploy contínuo.",
    summary: "Plataforma que desenvolvi integralmente para organizar a criação, revisão, aprovação e impressão de atividades, avaliações e simulados escolares. O sistema utiliza Python, FastAPI e MySQL/MariaDB, integra a KeepEdu, usa IA para gerar e revisar questões e gera documentos com ReportLab.",
    solution: "Organizei a aplicação em interface web, rotas FastAPI e serviços de autenticação, sincronização, atividades e histórico. O professor seleciona disciplina, conteúdo e critérios de dificuldade, ajusta as questões em uma prévia e gera o PDF. A atividade fica registrada como pendente até a aprovação da coordenação; depois, a gráfica pode registrar as cópias impressas. Cada perfil acessa apenas as operações e os registros previstos para sua função.",
    technicalDetails: [
      { title: "Sincronização e persistência", body: "Implementei a sincronização de questões, imagens, conteúdos e classificações do Gênesis para MySQL/MariaDB. O processo roda em segundo plano, registra o progresso e permite retomada. A sincronização é idempotente: execuções posteriores atualizam os registros sem duplicá-los. As questões são confirmadas no banco local antes de entrar na prévia ou no PDF." },
      { title: "Identidade e sessões", body: "Integrei o login à KeepEdu, que fornece identidade e papel do usuário, sem cadastro separado de senha. Implementei tokens de acesso e renovação em cookies HttpOnly, com revogação no servidor. A chave da API KeepEdu permanece no backend e não é enviada ao navegador." },
      { title: "Prévia editável", body: "Desenvolvi uma etapa de revisão em que o professor pode adicionar, remover e trocar questões, além de editar enunciados, alternativas, gabarito e linhas de resposta. Os ajustes acontecem antes da geração do documento, evitando gerar um novo PDF a cada alteração." },
      { title: "PDF e apresentação do conteúdo", body: "Implementei a geração com ReportLab, incluindo cabeçalho institucional, identificação da atividade, imagens, alternativas, paginação e gabarito opcional. O espaço de resposta é ajustado conforme o tipo de questão, com linhas para respostas discursivas e áreas para cálculos." },
      { title: "Permissões e fluxo operacional", body: "Implementei quatro papéis: professor, coordenação, gráfica e administrador. O professor acompanha suas atividades; a coordenação controla a disponibilidade por disciplina e série e aprova o material; a gráfica registra as cópias impressas. O histórico reúne os eventos de cada atividade." },
      { title: "Contexto escolar e importação", body: "A seleção de unidade, série e turmas é validada com a KeepEdu e salva por usuário, com cache para quando o serviço retorna vazio ou fica indisponível. O professor também importa questões próprias de PDFs e documentos do Google Drive, revisa o lote e o salva como uma lista privada ou compartilhada, que pode ser editada e impressa depois." },
      { title: "Geração e revisão com IA", body: "O professor pode gerar uma prévia com questões originais criadas pelo Gemini, seguindo o padrão pedagógico do banco. As questões geradas ficam só como rascunho e entram no banco apenas se forem mantidas na conclusão. Fórmulas usam LaTeX, e gráficos são renderizados a partir de dados estruturados, sem executar código produzido pela IA. Uma rotina agendada revisa as questões do banco em lotes, com locks no MySQL para evitar processamento duplicado entre réplicas, e as sugestões passam por aprovação de um professor." },
      { title: "Simulados e prova nominal", body: "Administradores montam simulados com questões do banco e os cadastram na KeepEdu, anexando o PDF e um gabarito em XLSX para a correção. A prova nominal gera um PDF por aluno a partir de uma lista de questões; os alunos são sempre consultados na KeepEdu, e o acesso a cada turma é verificado no servidor." },
      { title: "SSO, testes e deploy", body: "O login também funciona por SSO a partir do gestor da KeepEdu, com token de uso único e logout unificado entre os sistemas. O backend tem 271 testes em pytest, e a interface tem 68 testes de navegador com Playwright. Workflows do GitHub Actions publicam os ambientes de homologação e produção via SSH." },
    ],
    problem: { title: "Conectar preparação pedagógica, aprovação e impressão em um único processo.", body: "O fluxo atendido pelo Gênesis exigia selecionar questões, montar o documento e acompanhar sua aprovação e impressão. A proposta foi concentrar essas etapas na aplicação, com controle de acesso, revisão antes da geração e registro das operações, sem depender de planilhas ou downloads manuais de questões." },
    flow: ["Seleção", "Prévia editável", "PDF", "Aprovação", "Impressão"],
    description: "Plataforma completa de atividades, avaliações e simulados escolares: banco de questões, login KeepEdu, geração de questões com IA, prévia editável, PDF e fluxo de aprovação e impressão.",
    tags: ["Python", "FastAPI", "React", "IA"],
    technologies: ["Python 3.11+", "FastAPI", "Uvicorn", "MySQL / MariaDB", "PyMySQL", "ReportLab", "PyJWT", "Pydantic", "HTTPX / Requests", "Gemini API", "Matplotlib", "PyMuPDF / pdfplumber", "openpyxl", "Google Drive API", "React", "TypeScript", "Vite", "Tailwind CSS", "KaTeX / MathLive", "pytest", "Playwright", "GitHub Actions"],
    learnings: "As decisões de implementação respondem a responsabilidades distintas: a sincronização idempotente permite repetir importações sem duplicar registros; a prévia separa a edição da geração de PDF; a revogação no servidor permite invalidar sessões no logout; e os perfis de acesso organizam a passagem do material entre professor, coordenação e gráfica. Na IA, a regra é que nada gerado entra no banco sem passar por uma pessoa. A validação com contas reais da KeepEdu e com o provedor de IA acontece em homologação, já que os testes automatizados usam respostas simuladas. Entre as evoluções previstas está a exportação DOCX.",
    result: { title: "Professor, coordenação e gráfica acompanham a mesma atividade ao longo do processo. A revisão acontece antes da geração do PDF, a aprovação fica registrada no histórico e a impressão mantém o controle das cópias produzidas.", items: [] },
  },
  {
    number: "03", slug: "arboreo", title: "Arbóreo CRM",
    visual: "arboreo",
    status: "production",
    category: "CRM / Gestão comercial",
    role: "Desenvolvimento full stack",
    focus: "Vendas de móveis planejados",
    year: "2026",
    contribution: "Desenvolvi o sistema de gestão comercial da Arbóreo Móveis Planejados, em Teresina: o painel web em React e TypeScript, o banco e a autenticação no Supabase, as Edge Functions, o serviço Node.js/Express da API oficial do WhatsApp, a extensão para o WhatsApp Web e o site institucional, com deploy automatizado pelo GitHub Actions.",
    impacts: [{ value: "Lead → contrato", label: "no mesmo funil de vendas" }, { value: "WhatsApp", label: "integrado ao atendimento" }, { value: "Em uso", label: "na operação da Arbóreo" }],
    context: "Em uma empresa de móveis planejados, a venda começa no WhatsApp e passa por visita, orçamento de materiais, proposta, contrato e produção. Essas etapas ficavam espalhadas entre conversas, planilhas e documentos. O Arbóreo CRM reúne o atendimento, o funil comercial, os orçamentos e o financeiro em um painel usado pela equipe.",
    technicalDetails: [
      { title: "Funil comercial", body: "O pipeline em kanban organiza os negócios por etapa, com funis editáveis, tarefas, linha do tempo e temperatura das propostas. Um motor de follow-up avalia regras sobre negócios, propostas e tarefas e gera alertas para os negócios que precisam de retorno. O painel inicial mostra KPIs com detalhamento e metas comparadas ao realizado." },
      { title: "Orçamento, proposta e contrato", body: "O orçamento é montado a partir do cadastro de materiais, com importação de XML, CSV e PDF e reconciliação dos itens importados com o catálogo, incluindo um indicador de atualização do preço. A proposta aprovada gera o contrato a partir de um modelo, e os documentos são exportados em PDF. Fornecedores respondem cotações por uma página pública." },
      { title: "WhatsApp e Meta", body: "Um serviço Node.js/Express faz a conexão com a API oficial do WhatsApp pelo Embedded Signup da Meta: troca o código pelo token, cifra e guarda a credencial por empresa e valida a assinatura dos webhooks. As conversas aparecem no painel, e as mudanças de etapa do funil são reportadas à Meta Conversions API para medir as campanhas." },
      { title: "Extensão para o WhatsApp Web", body: "Uma extensão do Chrome (Manifest V3) adiciona uma barra lateral ao WhatsApp Web. Ao abrir uma conversa, ela mostra o cliente, os negócios, os orçamentos, as propostas e os contratos ligados àquele contato, sem que o vendedor precise trocar de tela." },
      { title: "Dados, acesso e segurança", body: "O banco PostgreSQL do Supabase usa Row Level Security para isolar os dados por empresa e tem mais de 50 migrações versionadas. Os perfis administrador, gestor e operador controlam o acesso, e o cadastro aberto foi substituído pela criação de usuários pelo administrador. Segredos de integrações são cifrados com AES-GCM e mascarados nas respostas, e as ações ficam em uma trilha de auditoria." },
      { title: "Financeiro e publicação", body: "O módulo financeiro registra lançamentos em formato de extrato, com centros de custo e consumo detalhado; o negócio só avança no pipeline após o contrato confirmado. O painel e o site institucional, otimizado para SEO, são publicados por workflows do GitHub Actions que aplicam as migrações e enviam o build à hospedagem." },
    ],
    solution: "Organizei o sistema em um painel React com TypeScript sobre o Supabase, que fornece banco, autenticação e Edge Functions, e um serviço Express dedicado à API oficial do WhatsApp. O vendedor acompanha o cliente da primeira mensagem ao contrato no mesmo lugar: a conversa, o negócio no funil, o orçamento de materiais, a proposta, o contrato e os lançamentos financeiros ficam ligados entre si.",
    description: "CRM em uso por uma empresa de móveis planejados: WhatsApp integrado, funil de vendas, orçamento de materiais, proposta, contrato e financeiro no mesmo painel.",
    tags: ["React", "TypeScript", "Supabase", "WhatsApp API"],
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "TanStack Query", "Supabase (PostgreSQL, Auth, RLS)", "Supabase Edge Functions (Deno)", "Node.js", "Express", "WhatsApp Cloud API", "Meta Conversions API", "Chrome Extension (Manifest V3)", "GitHub Actions"],
    summary: "CRM para uma empresa de móveis planejados, com atendimento pelo WhatsApp, funil de vendas, orçamentos, contratos e financeiro.",
    website: "https://arboreomoveisplanejados.com/",
    problem: { title: "Acompanhar uma venda longa, que começa numa conversa e termina num contrato.", body: "A venda de móveis planejados passa por muitas etapas e envolve materiais, preços de fornecedores e documentos. Sem um sistema, o histórico do cliente ficava dividido entre o WhatsApp e as planilhas, e não havia como ver quais negócios estavam parados." },
    flow: ["WhatsApp", "Lead", "Funil", "Orçamento", "Proposta", "Contrato", "Financeiro"],
    result: { title: "A equipe acompanha cada cliente da primeira mensagem ao contrato no mesmo painel.", items: [
      { title: "Contexto", body: "O histórico do cliente aparece junto da conversa no WhatsApp." },
      { title: "Ritmo", body: "Alertas de follow-up apontam os negócios que precisam de retorno." },
      { title: "Documentos", body: "Proposta e contrato saem do orçamento aprovado." },
    ] },
  },
  {
    number: "04", slug: "jusradar", title: "JusRadar",
    visual: "jusradar",
    category: "LegalTech / Backend",
    impacts: [{ value: "DataJud", label: "integrado à consulta" }, { value: "JWT", label: "na autenticação" }, { value: "Processos", label: "com cadastro de monitoramento" }],
    context: "O JusRadar organiza a consulta e o cadastro de monitoramentos de processos judiciais em uma API. A integração com o DataJud conecta os dados públicos dos tribunais à aplicação.",
    contribution: "Liderei o desenvolvimento de todo o backend em uma equipe de cinco pessoas, do planejamento das sprints à implementação. Trabalhei na integração com o DataJud, no monitoramento agendado de processos, na autenticação JWT e nas notificações por e-mail com anexos PDF e DOCX.",
    role: "Liderança e desenvolvimento backend",
    technicalDetails: [
      { title: "Autenticação e persistência", body: "Implementação de cadastro e login com Spring Security e JWT. Os dados são persistidos em PostgreSQL com Spring Data JPA, e as alterações de estrutura são versionadas com Flyway." },
      { title: "Consulta e monitoramento", body: "A integração com o DataJud permite consultar processos judiciais. Uma rotina agendada verifica os processos cadastrados e compara as movimentações com o estado armazenado para identificar alterações." },
      { title: "Notificações e documentos", body: "Desenvolvi notificações por e-mail com anexos PDF e DOCX, além de um endpoint de assistente jurídico com IA utilizando LLaMA via Groq. Essas funcionalidades complementam a consulta e o acompanhamento dos processos na aplicação." },
      { title: "Coordenação técnica", body: "Liderei a implementação do backend em uma equipe de cinco integrantes. Minha participação abrangeu o planejamento das sprints e o desenvolvimento das funcionalidades da API." },
    ],
    deliveryNote: "O case descreve o escopo desenvolvido e documentado. A versão pública do repositório consultada ainda contém conflitos de merge; não representa uma entrega de produção validada.",
    solution: "Backend em Java 21 e Spring Boot, com consulta via DataJud, cadastro e login com JWT, persistência em PostgreSQL e migrações versionadas com Flyway. A API é documentada com OpenAPI/Swagger.",
    problem: { title: "Conectar consulta processual e acompanhamento em um mesmo fluxo.", body: "O problema abordado é organizar o acesso aos dados processuais e registrar quais processos precisam ser acompanhados. O JusRadar reúne consulta por número e tribunal, autenticação de usuários e cadastro de monitoramentos." },
    flow: ["Autenticação", "Consulta", "DataJud", "Processo", "Monitoramento"],
    description: "Backend Java/Spring Boot que liderei em uma equipe de cinco pessoas, com consulta ao DataJud, autenticação JWT e monitoramento agendado de processos judiciais.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "APIs"],
    technologies: ["Java 21", "Spring Boot", "Spring Security", "Spring Data JPA", "PostgreSQL", "Flyway", "JWT", "OpenAPI / Swagger", "Maven", "React", "Vite"],
    repository: "https://github.com/MatheusHenriquePires/Jusradar",
  },
  {
    number: "05", slug: "liga-pe-de-porco", title: "Liga Pé de Porco",
    visual: "liga",
    category: "Sistema web / Esporte",
    role: "Desenvolvimento full stack",
    focus: "Gestão de campeonato",
    year: "2026",
    contribution: "Desenvolvi o site e o painel da liga: a API em Node.js com Fastify, o banco PostgreSQL, a interface em React e Vite e o processo de deploy na Vercel.",
    impacts: [{ value: "Tabela", label: "calculada direto no banco" }, { value: "Ao vivo", label: "placar e gols por jogador" }, { value: "Mata-mata", label: "semifinal e final com pênaltis" }],
    context: "Uma liga amadora de futebol precisa divulgar times, elencos, rodadas e classificação, e a organização precisa atualizar os resultados durante os jogos. A Liga Pé de Porco tem um site público para atletas e torcedores e um painel restrito para a organização.",
    technicalDetails: [
      { title: "Classificação no banco", body: "A tabela é uma view SQL calculada a partir das partidas encerradas da fase de liga, com três pontos por vitória e um por empate, e desempate por saldo e gols pró. Lançar um placar no painel atualiza a classificação sem nenhum recálculo na aplicação." },
      { title: "Jogos ao vivo e mata-mata", body: "As partidas têm os estados agendada, ao vivo e encerrada, e cada gol é registrado por jogador, alimentando a artilharia. As rodadas têm fase de liga, semifinal e final; em empate no mata-mata, o vencedor é decidido nos pênaltis e registrado na partida." },
      { title: "API e segurança", body: "A API em Fastify separa as rotas públicas de consulta das rotas de escrita, que passam por um hook de autenticação JWT. As senhas dos administradores são guardadas com bcrypt, e o token expira em oito horas. Escudos e fotos de jogadores são enviados a um bucket do Supabase Storage pelo backend, com validação de formato e tamanho." },
      { title: "Deploy na Vercel", body: "O frontend e a API são publicados em um único projeto da Vercel: o site como estático e o Fastify como função serverless. Como a detecção automática da Vercel falhava com o monorepo, montei o build no formato da Build Output API, empacotando a API com esbuild. O banco usa o connection pooler do Supabase, já que as funções serverless não alcançam a conexão direta via IPv6." },
    ],
    solution: "Separei o projeto em uma API Fastify com PostgreSQL e uma interface React. O público consulta times, elencos, rodadas, artilharia e classificação; a organização entra no painel para cadastrar times e jogadores, montar rodadas e lançar placares e gols, que aparecem imediatamente no site.",
    description: "Site e painel de uma liga de futebol amador: classificação calculada no banco, placar ao vivo com gols por jogador e fase de mata-mata.",
    tags: ["Node.js", "Fastify", "PostgreSQL", "React"],
    technologies: ["Node.js 20", "Fastify", "PostgreSQL", "JWT", "bcrypt", "Supabase Storage", "React 18", "Vite", "React Router", "esbuild", "Vercel", "Docker Compose"],
    summary: "Site público e painel administrativo de uma liga de futebol amador, com classificação, artilharia, jogos ao vivo e mata-mata.",
    repository: "https://github.com/MatheusHenriquePires/ligapedeporco",
    problem: { title: "Manter a tabela do campeonato atualizada sem fazer contas à mão.", body: "Em uma liga amadora, os resultados costumam ser divulgados em imagens e planilhas atualizadas manualmente. O sistema precisava permitir que a organização lançasse o resultado e que a classificação, a artilharia e as próximas partidas se atualizassem sozinhas." },
    flow: ["Painel", "Placar", "Gols", "View SQL", "Classificação", "Site"],
    result: { title: "A organização lança o placar e o site se atualiza sozinho.", items: [
      { title: "Sem planilhas", body: "Classificação e artilharia saem dos resultados registrados." },
      { title: "Durante o jogo", body: "Gols por jogador são lançados com a partida ao vivo." },
      { title: "Fim de campeonato", body: "Semifinal e final com decisão por pênaltis." },
    ] },
  },
];
