export const systems = {
  about: { label: "Full stack / Ferramentas de trabalho", nodes: [{symbol: "Py", title: "PYTHON", detail: "APIs e automação"}, {symbol: "{ }", title: "JAVA", detail: "Spring Boot"}, {symbol: "JS", title: "NODE.JS", detail: "serviços web"}, {symbol: "[ ]", title: "MYSQL", detail: "dados relacionais"}], command: "python · java · node", output: "backend + interface web" },
  contact: { label: "Conexões / Contato profissional", nodes: [{symbol: "@", title: "CONTATO", detail: "Matheus Henrique"}, {symbol: "</>", title: "GITHUB", detail: "código e projetos"}, {symbol: "in", title: "LINKEDIN", detail: "perfil profissional"}, {symbol: "=>", title: "CONVERSA", detail: "projetos e equipes"}], command: "connect → collaborate", output: "uma conexão, novas possibilidades." },
  architecture: {
    label: "Arquitetura / Interface · API · Dados",
    nodes: [{ symbol: "{ }", title: "API", detail: "integração" }, { symbol: "</>", title: "INTERFACE", detail: "aplicação web" }, { symbol: "[ ]", title: "DATA", detail: "persistência" }, { symbol: "=>", title: "WORKER", detail: "automação" }],
    command: "interface → API → dados", output: "serviços conectados.",
  },
  "arena-replay": {
    label: "Arena Replay / Pipeline",
    nodes: [{ symbol: "REC", title: "CÂMERA", detail: "captura" }, { symbol: "●", title: "EVENTO", detail: "acionamento" }, { symbol: "{ }", title: "AGENTE", detail: "MP4 + fila" }, { symbol: "▷", title: "CLIPE / WEB", detail: "replay" }],
    command: "capture → process → replay", output: "o momento vira um clipe.",
  },
  genesis: {
    label: "Gênesis / Atividades",
    nodes: [{ symbol: "[ ]", title: "QUESTÕES", detail: "banco de dados" }, { symbol: "{ }", title: "CRITÉRIOS", detail: "seleção" }, { symbol: "=>", title: "GERAÇÃO", detail: "atividade" }, { symbol: "PDF", title: "DOCUMENTO", detail: "material pronto" }],
    command: "editar → gerar → aprovar", output: "da atividade à impressão.",
  },
  jusradar: {
    label: "JusRadar / Integração",
    nodes: [{ symbol: "{ }", title: "CONSULTA", detail: "API" }, { symbol: "JWT", title: "IDENTIDADE", detail: "autenticação" }, { symbol: "[ ]", title: "DATAJUD", detail: "dados processuais" }, { symbol: "↳", title: "MONITORAMENTO", detail: "acompanhamento" }],
    command: "authenticate → query → track", output: "informação conectada.",
  },
  arboreo: {
    label: "Arbóreo CRM / Funil comercial",
    nodes: [{ symbol: "@", title: "WHATSAPP", detail: "atendimento" }, { symbol: "=>", title: "FUNIL", detail: "negócios" }, { symbol: "[ ]", title: "ORÇAMENTO", detail: "materiais" }, { symbol: "PDF", title: "CONTRATO", detail: "proposta aprovada" }],
    command: "lead → proposta → contrato", output: "a venda inteira em um painel.",
  },
  liga: {
    label: "Liga Pé de Porco / Campeonato",
    nodes: [{ symbol: "JWT", title: "PAINEL", detail: "organização" }, { symbol: "●", title: "PARTIDA", detail: "placar ao vivo" }, { symbol: "[ ]", title: "VIEW SQL", detail: "classificação" }, { symbol: "</>", title: "SITE", detail: "público" }],
    command: "placar → tabela → site", output: "o resultado vira classificação.",
  },
} as const;

export type Stage = { text: string; input: string; output: string; steps: string[] };

/** Explicação de cada etapa do pipeline, na mesma ordem de `systems[variant].nodes`. */
export const stages: Partial<Record<VisualVariant, Stage[]>> = {
  "arena-replay": [
    { text: "Um processo FFmpeg por quadra lê o DVR via RTSP o tempo todo e grava segmentos H.264 de um segundo em disco. Como o buffer guarda sempre os segmentos mais recentes, o lance já está gravado antes de alguém pedir o replay.", input: "câmera RTSP", output: "buffer de 1 s", steps: ["O FFmpeg lê o canal da quadra no DVR", "O vídeo vira segmentos H.264 de 1 s", "Segmentos antigos são descartados, salvo os protegidos"] },
    { text: "Depois do ponto, o atleta aperta o botão no canto da quadra. O cabo leva o sinal até o switch Zero Delay, que o PC lê como um controle USB. Cada botão tem um código ligado a uma quadra.", input: "botão físico", output: "código USB", steps: ["O atleta aperta o botão no canto da quadra", "O switch Zero Delay entrega o código por USB", "Só a pressão conta, com cooldown de 3 s por botão"] },
    { text: "O agente traduz o código na quadra, fixa a janela de 15 s antes e 5 s depois e protege esses segmentos da limpeza. Depois exporta o MP4 e grava o envio em uma fila SQLite, que resiste a quedas de internet e a reinícios.", input: "código do botão", output: "MP4 na fila", steps: ["Lê o código e identifica a quadra", "Junta 15 s antes e 5 s depois em um MP4", "Registra o envio na fila SQLite"] },
    { text: "O agente pede um envio ao backend e recebe uma URL pré-assinada para mandar o MP4 direto ao Cloudflare R2. Na confirmação, o servidor verifica no R2 se o arquivo existe e é um MP4 válido. Só então o replay aparece na galeria.", input: "MP4", output: "replay na galeria", steps: ["POST /api/replays devolve a URL pré-assinada", "O agente envia o vídeo direto ao R2", "O backend confere o arquivo e publica na galeria"] },
  ],
  genesis: [
    { text: "Uma sincronização em segundo plano copia do Gênesis as questões, imagens, conteúdos e classificações para o MySQL local. Ela é idempotente: rodar de novo atualiza os registros sem duplicar. Só questões confirmadas no banco entram na prévia.", input: "Gênesis", output: "banco local", steps: ["Copia questões, imagens e conteúdos", "Atualiza o que já existe, sem duplicar", "Registra o progresso e permite retomar"] },
    { text: "O professor escolhe série, disciplina, conteúdos, quantidade, dificuldade e tipo de questão. Antes de selecionar, a API confere se a coordenação liberou aquela disciplina e série para a unidade dele.", input: "critérios", output: "questões", steps: ["Escolhe série, disciplina e conteúdos", "Define quantidade, dificuldade e tipo", "A API confere a liberação e seleciona as questões"] },
    { text: "As questões abrem em uma prévia editável antes de virar documento. O professor remove, troca ou adiciona questões e edita enunciados, alternativas e gabarito sem gerar um PDF novo a cada ajuste.", input: "questões", output: "prévia editável", steps: ["Revisa a prévia da atividade", "Remove, troca ou adiciona questões", "Edita enunciados, alternativas e gabarito"] },
    { text: "O ReportLab gera o PDF com cabeçalho, imagens, espaço de resposta e gabarito opcional, e a atividade entra no histórico como pendente. A coordenação aprova ou reprova com um motivo, e a gráfica registra as cópias impressas.", input: "prévia", output: "PDF impresso", steps: ["O ReportLab gera o PDF e a atividade fica pendente", "A coordenação aprova, ou reprova com motivo", "A gráfica imprime e registra as cópias"] },
  ],
  jusradar: [
    { text: "O usuário informa o número do processo e o tribunal. A API deixa só os dígitos do número e escolhe o índice público do tribunal no DataJud: TJPI por padrão, ou TRF1 e TRF2.", input: "número + tribunal", output: "requisição", steps: ["O usuário informa número e tribunal", "A API mantém só os dígitos do número", "Escolhe o índice do tribunal no DataJud"] },
    { text: "Cadastro e login usam Spring Security, com senha guardada em BCrypt. O token JWT emitido carrega o id do advogado e o papel, e é ele que separa os monitoramentos de cada advogado.", input: "login", output: "token JWT", steps: ["Cadastro com senha em BCrypt", "O login emite um token JWT", "O token identifica o advogado nas chamadas"] },
    { text: "A API faz uma busca no índice público do DataJud usando a chave de acesso. Da resposta, ela extrai classe, órgão julgador e data de atualização, e o último movimento vira a situação do processo.", input: "consulta", output: "dados do processo", steps: ["Busca o processo pelo número no DataJud", "Lê classe, órgão julgador e data", "O último movimento vira a situação atual"] },
    { text: "Todo dia às 3h, uma rotina agendada consulta de novo cada processo monitorado e compara o último movimento com o salvo. Se mudou, o cliente recebe um e-mail. O advogado recebe outro com uma análise da IA via Groq e uma manifestação pronta em PDF e DOCX.", input: "processo monitorado", output: "e-mails + documentos", steps: ["A rotina roda todo dia às 3h", "Compara o último movimento com o salvo", "Avisa cliente e advogado, com PDF e DOCX"] },
  ],
  arboreo: [
    { text: "O WhatsApp da empresa é conectado pelo cadastro oficial da Meta, e o token fica cifrado por empresa. Cada mensagem chega por webhook com a assinatura conferida e entra na conversa do painel, que a extensão também mostra dentro do WhatsApp Web.", input: "mensagem", output: "conversa no painel", steps: ["O cliente chama no WhatsApp", "O webhook confere a assinatura da Meta", "A conversa aparece no painel e na extensão"] },
    { text: "O negócio avança por um funil em kanban, com tarefas e linha do tempo. Um motor de follow-up acompanha os prazos: proposta enviada há 24 h vira tarefa, 48 h sem resposta sugere uma mensagem pronta e 7 dias parado gera alerta.", input: "conversa", output: "negócio no funil", steps: ["O negócio entra no funil e avança por etapa", "Regras de follow-up criam tarefas e sugerem mensagens", "Cada mudança de etapa é reportada à Meta"] },
    { text: "O orçamento é montado com o cadastro de materiais e aceita importar itens de XML, CSV ou PDF. Cada item importado é reconciliado com o catálogo, e o preço mostra se foi atualizado nos últimos 15 dias, nos últimos 45 ou se está desatualizado.", input: "projeto", output: "proposta", steps: ["Importa itens de XML, CSV ou PDF", "Reconcilia cada item com o catálogo", "Sinaliza preços com mais de 45 dias"] },
    { text: "A proposta aprovada vira contrato a partir de um modelo, com versões registradas e exportação em PDF. Confirmar o contrato é a única forma de levar o negócio para Fechado. Nesse momento, o orçamento é travado e os ambientes de produção são criados com a data de entrega.", input: "proposta aprovada", output: "contrato fechado", steps: ["Gera o contrato a partir do modelo", "Confirma e move o negócio para Fechado", "Trava o orçamento e cria os ambientes de produção"] },
  ],
  liga: [
    { text: "A organização entra no painel com usuário e senha, conferida com bcrypt. A API devolve um token JWT de oito horas, exigido só nas rotas de escrita. As rotas de consulta continuam públicas.", input: "login", output: "token JWT", steps: ["A senha é conferida com bcrypt", "A API emite um token de oito horas", "Só as rotas de escrita exigem o token"] },
    { text: "Ao iniciar a partida, o painel a coloca ao vivo com o placar zerado. Cada gol é lançado por jogador e soma no placar do time certo e na artilharia. Um gol lançado por engano pode ser desfeito.", input: "gol", output: "placar atualizado", steps: ["A partida fica ao vivo com placar zerado", "Cada gol soma no time e no artilheiro", "Empate no mata-mata exige o vencedor nos pênaltis"] },
    { text: "A classificação é uma view SQL sobre as partidas encerradas da fase de liga. Encerrar uma partida já muda a tabela, sem nenhum recálculo na aplicação.", input: "partidas encerradas", output: "tabela", steps: ["Vitória vale 3 pontos, empate 1", "Ordena por pontos, saldo e gols pró", "Semifinal e final ficam fora da tabela"] },
    { text: "O site público lê a API sem login e mostra tabela, artilharia, rodadas e próximos jogos. A página inicial busca os jogos de novo a cada 15 segundos, então uma partida ao vivo aparece em destaque com o placar atualizado.", input: "dados da liga", output: "site atualizado", steps: ["Classificação e artilharia", "Rodadas e resultados", "Jogo ao vivo atualizado a cada 15 s"] },
  ],
};

export type VisualVariant = keyof typeof systems;
