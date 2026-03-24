import { ACTIVE_REGIONS, CAP } from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function rn(a, b) { return Math.round(a + Math.random() * (b - a)); }
function rf(a, b) { return +((a + Math.random() * (b - a)).toFixed(2)); }

// ── Trend per sede ────────────────────────────────────────────────────────────
function generateSiteTrend(tipo, sat) {
  return Array.from({ length: 30 }, (_, i) => {
    let latenza, pktLoss;

    if (tipo === 'LTE') {
      latenza = Math.min(500, Math.round(160 + i * 4 + rn(-15, 25)));
      pktLoss = rf(5, 13);
    } else if (tipo === 'DSL') {
      latenza = rn(45, 90);
      pktLoss = rf(1.0, 4.0);
    } else if (sat >= 80) {
      latenza = Math.min(400, Math.round(35 + i * 2.8 + rn(-8, 18)));
      pktLoss = rf(2.0, 8.0);
    } else if (sat >= 50) {
      latenza = rn(15, 45);
      pktLoss = rf(0.3, 1.5);
    } else {
      latenza = rn(4, 18);
      pktLoss = rf(0.0, 0.4);
    }

    return { latenza, pktLoss };
  });
}

// ── Builder sede ──────────────────────────────────────────────────────────────
function buildSite(reg, tipo, banda, pktLoss, so115) {
  const cap = CAP[tipo];
  const sat = Math.round(banda / cap * 100);
  return { reg, tipo, banda, cap, pktLoss, so115, trend: generateSiteTrend(tipo, sat) };
}

// ── Marcatori mappa ───────────────────────────────────────────────────────────
const PROV_MARKERS_NISCEMI = [
  { name: 'Caltanissetta', x: 335, y: 630 },
  { name: 'Agrigento',     x: 300, y: 645 },
  { name: 'Ragusa',        x: 375, y: 655 },
];
const EPICENTER_NISCEMI = { x: 352, y: 645 };

// ── Dati provinciali per scenario ─────────────────────────────────────────────
// Ogni entry: { nome, rete, satellitare, so115, stato }
const PROVINCES_NISCEMI = {
  'Sicilia': [
    { nome: 'Caltanissetta', rete: 'LTE',   satellitare: false, so115: 18, stato: 'EMERGENZA' },
    { nome: 'Agrigento',     rete: 'DSL',   satellitare: false, so115: 8,  stato: 'DEGRADATO' },
    { nome: 'Ragusa',        rete: 'DSL',   satellitare: false, so115: 6,  stato: 'DEGRADATO' },
    { nome: 'Enna',          rete: 'Fibra', satellitare: false, so115: 3,  stato: 'OPERATIVO' },
    { nome: 'Palermo',       rete: 'Fibra', satellitare: false, so115: 2,  stato: 'OPERATIVO' },
    { nome: 'Catania',       rete: 'Fibra', satellitare: false, so115: 2,  stato: 'OPERATIVO' },
    { nome: 'Siracusa',      rete: 'Fibra', satellitare: false, so115: 1,  stato: 'OPERATIVO' },
    { nome: 'Messina',       rete: 'Fibra', satellitare: false, so115: 1,  stato: 'OPERATIVO' },
    { nome: 'Trapani',       rete: 'Fibra', satellitare: false, so115: 0,  stato: 'OPERATIVO' },
  ],
  'Calabria': [
    { nome: 'Catanzaro',     rete: 'DSL',   satellitare: false, so115: 7, stato: 'DEGRADATO' },
    { nome: 'Crotone',       rete: 'DSL',   satellitare: false, so115: 5, stato: 'DEGRADATO' },
    { nome: 'Cosenza',       rete: 'Fibra', satellitare: false, so115: 2, stato: 'OPERATIVO' },
    { nome: 'Reggio C.',     rete: 'Fibra', satellitare: false, so115: 1, stato: 'OPERATIVO' },
    { nome: 'Vibo Valentia', rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
  ],
};

const PROVINCES_ANOMALIA = {
  'Calabria': [
    { nome: 'Catanzaro',     rete: 'Fibra', satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Cosenza',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Reggio C.',     rete: 'Fibra', satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Crotone',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'DEGRADATO' },
    { nome: 'Vibo Valentia', rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
  ],
  'Sicilia': [
    { nome: 'Palermo',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Catania',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Messina',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'DEGRADATO' },
    { nome: 'Agrigento',     rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Caltanissetta', rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Enna',          rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Trapani',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Ragusa',        rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Siracusa',      rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
  ],
  'Puglia': [
    { nome: 'Bari',          rete: 'DSL',   satellitare: false, so115: 0, stato: 'EMERGENZA' },
    { nome: 'Lecce',         rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Taranto',       rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Foggia',        rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'Brindisi',      rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
    { nome: 'BAT',           rete: 'Fibra', satellitare: false, so115: 0, stato: 'OPERATIVO' },
  ],
};

// ── SCENARIO 1: Normale ───────────────────────────────────────────────────────
function generateNormal() {
  return ACTIVE_REGIONS.map(reg =>
    buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3))
  );
}

// ── SCENARIO 2: Frana di Niscemi (CL) — 14/03/2025 ───────────────────────────
function generateNiscemi() {
  const critiche  = ['Sicilia'];
  const degradate = ['Calabria'];

  return ACTIVE_REGIONS.map(reg => {
    if (critiche.includes(reg))
      return buildSite(reg, 'LTE',   rn(3, 4),  rf(5.0, 12.0), rn(15, 28));
    if (degradate.includes(reg))
      return buildSite(reg, 'DSL',   rn(5, 7),  rf(1.0,  3.5), rn(5,  12));
    return   buildSite(reg, 'Fibra', rn(8, 35), rf(0.0,  0.4), rn(0,   4));
  });
}

// ── SCENARIO 3: Anomalia Operativa — Attacco Informatico (Calabria) ───────────
function generateAnomaliaCalabria() {
  const anomale = {
    'Calabria': { tipo: 'Fibra', banda: rn(88, 93), pktLoss: rf(3.0, 8.0), so115: 0 },
    'Sicilia':  { tipo: 'Fibra', banda: rn(84, 91), pktLoss: rf(2.5, 7.0), so115: 0 },
    'Puglia':   { tipo: 'DSL',   banda: rn(7,  8),  pktLoss: rf(1.5, 4.0), so115: 0 },
  };

  return ACTIVE_REGIONS.map(reg => {
    const a = anomale[reg];
    if (a) return buildSite(reg, a.tipo, a.banda, a.pktLoss, a.so115);
    return buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3));
  });
}

// ── Registro scenari ──────────────────────────────────────────────────────────
export const SCENARIOS = {
  normal: {
    id:              'normal',
    label:           'Normale',
    badge:           'Operativo',
    badgeClass:      'badge-ok',
    data:            generateNormal(),
    provs:           [],
    epicenter:       null,
    criticalRegions: [],
    provinces:       {},
    supreme:         null,
  },

  niscemi: {
    id:              'niscemi',
    label:           'Emergenza — Frana Niscemi',
    badge:           'Emergenza — Frana Niscemi (CL) 14/03/2025',
    badgeClass:      'badge-crit',
    data:            generateNiscemi(),
    provs:           PROV_MARKERS_NISCEMI,
    epicenter:       EPICENTER_NISCEMI,
    criticalRegions: ['Sicilia', 'Calabria'],
    provinces:       PROVINCES_NISCEMI,
    supreme: {
      codem:   'EM-2025-031',
      evento:  'Frana Niscemi — Caltanissetta (CL)',
      livello: 'REGIONALE',
      moduli: {
        'MS.ICT': {
          stato:        'ALLERTATO',
          personale:    '3 TLC + 3 Inf.',
          mezzi:        ['PRT (ponti radio)', 'CRT/SRC (satellite)', 'Auto connettività'],
          impedimenti:  ['Veicolo PRT in manutenzione presso officina CL'],
        },
        'MS.COEM': {
          stato:        'PRONTO',
          personale:    '2 addetti COEM',
          mezzi:        ['Mezzo attrezzato comunicazioni'],
          impedimenti:  [],
        },
        'MS.TAST': {
          stato:        'PRONTO',
          personale:    '1 ICT',
          mezzi:        ['Autovettura'],
          impedimenti:  [],
        },
      },
    },
  },

  anomaliaCalabria: {
    id:              'anomaliaCalabria',
    label:           'Anomalia — Attacco Informatico',
    badge:           'Anomalia Operativa — Attacco Informatico (Calabria / Sicilia / Puglia)',
    badgeClass:      'badge-crit',
    data:            generateAnomaliaCalabria(),
    provs:           [],
    epicenter:       null,
    criticalRegions: ['Calabria', 'Sicilia', 'Puglia'],
    provinces:       PROVINCES_ANOMALIA,
    supreme: {
      codem:   null,
      evento:  null,
      livello: null,
      moduli:  null,
    },
  },
};
