export const coreModules = [
  { id: "api", symbol: "{ }", label: "API", description: "Implementação de endpoints, autenticação e integração entre serviços.", stack: "Python · FastAPI · Java · Spring Boot", x: 50, y: 19 },
  { id: "ui", symbol: "</>", label: "UI", description: "Interfaces web para operar os sistemas e acompanhar seus resultados.", stack: "JavaScript · React · HTML · CSS", x: 22, y: 49 },
  { id: "data", symbol: "[ ]", label: "DATA", description: "Persistência, consultas e organização de dados relacionais.", stack: "MySQL · PostgreSQL · SQL", x: 78, y: 49 },
  { id: "worker", symbol: "=>", label: "WORKER", description: "Rotinas de sincronização, processamento e geração de documentos.", stack: "Python · Node.js · ReportLab", x: 50, y: 79 },
] as const;
