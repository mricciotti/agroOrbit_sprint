// Tipos TypeScript
export type StatusSeveridade = 'normal' | 'atencao' | 'critico';
export type StatusAlerta = 'aberto' | 'em_andamento' | 'resolvido';
export type TipoFonte = 'Satélite' | 'Drone' | 'IoT';

export interface Talhao {
  id: string;
  nome: string;
  cultura: string;
  area: number;
  statusSaude: StatusSeveridade;
  ultimaLeitura: string;
  observacao: string;
}

export interface Fazenda {
  id: string;
  nome: string;
  area: number;
  localizacao: { latitude: number; longitude: number };
  statusGeral: StatusSeveridade;
  talhoes: Talhao[];
}

export interface Alerta {
  id: string;
  fazendaId: string;
  talhaoId: string;
  tipoFonte: TipoFonte;
  titulo: string;
  descricao: string;
  data: string;
  status: StatusAlerta;
  severidade: StatusSeveridade;
  confiancaIA: number;
}

export interface Relatorio {
  id: string;
  semana: string;
  titulo: string;
  resumo: string;
  dataGeracao: string;
  anomaliasDetectadas: {
    tipo: string;
    fonte: string;
    afetados: number;
    confiancaIA: number;
  }[];
  metricas: {
    areaMonitorada: number;
    voosRealizados: number;
    leiturasSatelite: number;
    leiturasIoT: number;
  };
  odsRelacionadas: number[];
  recomendacoes: string[];
}

// Dados mockados das fazendas e talhões
export const fazendas: Fazenda[] = [
  {
    id: '1',
    nome: 'Fazenda Santa Clara',
    area: 1250,
    localizacao: { latitude: -23.5489, longitude: -46.6388 }, // Sudeste — Campinas, SP
    statusGeral: 'normal',
    talhoes: [
      {
        id: 't1',
        nome: 'Talhão Norte',
        cultura: 'Soja',
        area: 320,
        statusSaude: 'normal',
        ultimaLeitura: '2024-01-15',
        observacao: 'Desenvolvimento saudável detectado via satélite',
      },
      {
        id: 't2',
        nome: 'Talhão Sul',
        cultura: 'Milho',
        area: 280,
        statusSaude: 'atencao',
        ultimaLeitura: '2024-01-15',
        observacao: 'Possível estresse hídrico detectado - Drone recomendado',
      },
      {
        id: 't3',
        nome: 'Talhão Leste',
        cultura: 'Algodão',
        area: 400,
        statusSaude: 'critico',
        ultimaLeitura: '2024-01-14',
        observacao: 'Seca severa detectada via satélite - Ação urgente',
      },
      {
        id: 't4',
        nome: 'Talhão Oeste',
        cultura: 'Café',
        area: 250,
        statusSaude: 'normal',
        ultimaLeitura: '2024-01-15',
        observacao: 'Vegetação em ótimo estado',
      },
    ],
  },
  {
    id: '2',
    nome: 'Fazenda Boa Vista',
    area: 890,
    localizacao: { latitude: -3.7172, longitude: -38.5431 }, // Nordeste — Fortaleza, CE
    statusGeral: 'atencao',
    talhoes: [
      {
        id: 't5',
        nome: 'Talhão Principal',
        cultura: 'Cana-de-açúcar',
        area: 500,
        statusSaude: 'atencao',
        ultimaLeitura: '2024-01-15',
        observacao: 'Manchas detectadas por drone - Possível praga',
      },
      {
        id: 't6',
        nome: 'Talhão Secundário',
        cultura: 'Soja',
        area: 390,
        statusSaude: 'normal',
        ultimaLeitura: '2024-01-15',
        observacao: 'Condições ideais de crescimento',
      },
    ],
  },
  {
    id: '3',
    nome: 'Fazenda Nova Esperança',
    area: 2100,
    localizacao: { latitude: -15.5989, longitude: -56.0949 }, // Centro-Oeste — Cuiabá, MT
    statusGeral: 'critico',
    talhoes: [
      {
        id: 't7',
        nome: 'Talhão A',
        cultura: 'Milho',
        area: 700,
        statusSaude: 'critico',
        ultimaLeitura: '2024-01-15',
        observacao: 'Falha de vegetação em 30% da área - Drone confirmou',
      },
      {
        id: 't8',
        nome: 'Talhão B',
        cultura: 'Soja',
        area: 800,
        statusSaude: 'atencao',
        ultimaLeitura: '2024-01-14',
        observacao: 'Sensor IoT: Umidade do solo abaixo do ideal',
      },
      {
        id: 't9',
        nome: 'Talhão C',
        cultura: 'Feijão',
        area: 600,
        statusSaude: 'normal',
        ultimaLeitura: '2024-01-15',
        observacao: 'Desenvolvimento dentro do esperado',
      },
    ],
  },
];

// Dados mockados dos alertas
export const alertasIniciais: Alerta[] = [
  {
    id: 'a1',
    fazendaId: '1',
    talhaoId: 't3',
    tipoFonte: 'Satélite',
    titulo: 'Seca Severa Detectada',
    descricao: 'Análise de NDVI indica estresse hídrico crítico no Talhão Leste. Recomenda-se irrigação imediata.',
    data: '2024-01-15T08:30:00Z',
    status: 'aberto',
    severidade: 'critico',
    confiancaIA: 94,
  },
  {
    id: 'a2',
    fazendaId: '2',
    talhaoId: 't5',
    tipoFonte: 'Drone',
    titulo: 'Possível Infestação de Pragas',
    descricao: 'Imagens de drone detectaram padrões irregulares nas folhas. IA identificou 78% de probabilidade de lagarta-do-cartucho.',
    data: '2024-01-15T10:15:00Z',
    status: 'em_andamento',
    severidade: 'atencao',
    confiancaIA: 78,
  },
  {
    id: 'a3',
    fazendaId: '3',
    talhaoId: 't7',
    tipoFonte: 'Satélite',
    titulo: 'Falha de Vegetação Extensa',
    descricao: 'Imagens de satélite mostram 30% de área com falha de vegetação. Possível problema de germinação ou doença.',
    data: '2024-01-14T14:45:00Z',
    status: 'aberto',
    severidade: 'critico',
    confiancaIA: 89,
  },
  {
    id: 'a4',
    fazendaId: '3',
    talhaoId: 't8',
    tipoFonte: 'IoT',
    titulo: 'Umidade do Solo Baixa',
    descricao: 'Sensores IoT registraram umidade do solo em 18%, abaixo do mínimo recomendado de 25% para soja.',
    data: '2024-01-15T06:00:00Z',
    status: 'aberto',
    severidade: 'atencao',
    confiancaIA: 100,
  },
  {
    id: 'a5',
    fazendaId: '1',
    talhaoId: 't2',
    tipoFonte: 'Satélite',
    titulo: 'Estresse Hídrico Moderado',
    descricao: 'Análise espectral indica início de estresse hídrico. Monitoramento recomendado.',
    data: '2024-01-15T09:00:00Z',
    status: 'resolvido',
    severidade: 'atencao',
    confiancaIA: 72,
  },
  {
    id: 'a7',
    fazendaId: '2',
    talhaoId: 't5',
    tipoFonte: 'Drone',
    titulo: 'Mancha Foliar em Expansão',
    descricao: 'Drone identificou mancha foliar com padrão de expansão lateral. Equipe técnica acionada para avaliação presencial e coleta de amostras.',
    data: '2026-06-02T08:00:00Z',
    status: 'em_andamento',
    severidade: 'atencao',
    confiancaIA: 81,
  },
  {
    id: 'a6',
    fazendaId: '1',
    talhaoId: 't1',
    tipoFonte: 'Drone',
    titulo: 'Verificação de Rotina Concluída',
    descricao: 'Voo de drone concluído. Nenhuma anomalia detectada no Talhão Norte.',
    data: '2024-01-14T16:30:00Z',
    status: 'resolvido',
    severidade: 'normal',
    confiancaIA: 95,
  },
];

// Dados mockados dos relatórios semanais
export const relatorios: Relatorio[] = [
  {
    id: 'r1',
    semana: '08/01/2024 - 14/01/2024',
    titulo: 'Relatório Semanal - Semana 2',
    resumo: 'Semana marcada por condições climáticas adversas. 3 alertas críticos registrados.',
    dataGeracao: '2024-01-14T23:59:00Z',
    anomaliasDetectadas: [
      {
        tipo: 'Estresse Hídrico',
        fonte: 'Satélite',
        afetados: 2,
        confiancaIA: 87,
      },
      {
        tipo: 'Falha de Vegetação',
        fonte: 'Drone',
        afetados: 1,
        confiancaIA: 91,
      },
    ],
    metricas: {
      areaMonitorada: 4240,
      voosRealizados: 12,
      leiturasSatelite: 28,
      leiturasIoT: 1680,
    },
    odsRelacionadas: [2, 9, 13],
    recomendacoes: [
      'Priorizar irrigação nos talhões com estresse hídrico crítico',
      'Agendar inspeção manual no Talhão A da Fazenda Nova Esperança',
      'Revisar calendário de aplicação de defensivos na Fazenda Boa Vista',
    ],
  },
  {
    id: 'r2',
    semana: '01/01/2024 - 07/01/2024',
    titulo: 'Relatório Semanal - Semana 1',
    resumo: 'Início de ano com condições favoráveis. Monitoramento preventivo em dia.',
    dataGeracao: '2024-01-07T23:59:00Z',
    anomaliasDetectadas: [
      {
        tipo: 'Mancha Foliar',
        fonte: 'Drone',
        afetados: 1,
        confiancaIA: 68,
      },
    ],
    metricas: {
      areaMonitorada: 4240,
      voosRealizados: 8,
      leiturasSatelite: 21,
      leiturasIoT: 1512,
    },
    odsRelacionadas: [2, 9, 13],
    recomendacoes: [
      'Manter rotina de monitoramento',
      'Verificar calibração dos sensores IoT',
    ],
  },
];
