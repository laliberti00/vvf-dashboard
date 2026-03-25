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

// ── Solo epicentro (X sulla mappa), niente pallini provinciali ────────────────
// Coordinate SVG Sicilia: bounding box reale X:272→463, Y:580→792
// Niscemi si trova al confine Caltanissetta/Ragusa, zona centro-sud
const EPICENTER_NISCEMI = { x: 362, y: 698 };

// ═══════════════════════════════════════════════════════════════════════════════
// DATI PROVINCIALI — SCENARIO FRANA NISCEMI (14/03/2025)
// Struttura ogni comando: { nome, tipo, banda, pktLoss, so115 }
// cap viene calcolato in Dashboard da CAP[tipo]; sat = banda/cap*100
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sicilia — Frana Niscemi ───────────────────────────────────────────────────
// C.P. Caltanissetta: collegamento LTE (antenna locale inagibile per frana),
//   alto traffico SO115 (18 chiamate attive), fallback su rete mobile 4G
// C.P. Agrigento: DSL (linea PTT degradata per overflow traffico), interventi
//   in supporto zona confinante, 8 squadre impegnate
// C.P. Ragusa: DSL (congestione per traffico di supporto), 6 squadre attive
// C.P. Enna: Fibra stabile, monitoraggio preventivo versanti franosi zona
// C.P. Catania: Fibra stabile, rinforzi in attesa di ordine di marcia
// C.P. Palermo: Fibra stabile — sede D.R. Sicilia, attività di coordinamento
// C.P. Messina: Fibra stabile, nessun coinvolgimento diretto
// C.P. Siracusa: Fibra stabile, nessun coinvolgimento diretto
// C.P. Trapani: Fibra stabile, nessun coinvolgimento diretto
const PROV_SIC_NISCEMI = [
  { nome: 'Caltanissetta', tipo: 'LTE',   banda: 3.2, pktLoss: 9.1, so115: 18 },
  { nome: 'Agrigento',     tipo: 'DSL',   banda: 6.4, pktLoss: 2.9, so115: 8  },
  { nome: 'Ragusa',        tipo: 'DSL',   banda: 6.1, pktLoss: 2.3, so115: 6  },
  { nome: 'Enna',          tipo: 'Fibra', banda: 12,  pktLoss: 0.1, so115: 3  },
  { nome: 'Catania',       tipo: 'Fibra', banda: 22,  pktLoss: 0.2, so115: 3  },
  { nome: 'Palermo',       tipo: 'Fibra', banda: 28,  pktLoss: 0.3, so115: 2  },
  { nome: 'Messina',       tipo: 'Fibra', banda: 15,  pktLoss: 0.2, so115: 1  },
  { nome: 'Siracusa',      tipo: 'Fibra', banda: 9,   pktLoss: 0.1, so115: 1  },
  { nome: 'Trapani',       tipo: 'Fibra', banda: 8,   pktLoss: 0.0, so115: 0  },
];

// ── Calabria — Frana Niscemi ──────────────────────────────────────────────────
// C.P. Catanzaro: DSL degradato per overflow di traffico di monitoraggio
//   proveniente dai comandi siciliani (saturazione tratta backbone sud)
// C.P. Crotone: DSL in congestione per stesse cause, supporto logistico attivo
// C.P. Cosenza: Fibra stabile, nessun coinvolgimento operativo
// C.P. Reggio Calabria: Fibra stabile, personale in stand-by
// C.P. Vibo Valentia: Fibra stabile, nessun coinvolgimento
const PROV_CAL_NISCEMI = [
  { nome: 'Catanzaro',       tipo: 'DSL',   banda: 5.8, pktLoss: 2.2, so115: 7 },
  { nome: 'Crotone',         tipo: 'DSL',   banda: 6.2, pktLoss: 1.9, so115: 5 },
  { nome: 'Cosenza',         tipo: 'Fibra', banda: 18,  pktLoss: 0.2, so115: 2 },
  { nome: 'Reggio Calabria', tipo: 'Fibra', banda: 21,  pktLoss: 0.1, so115: 1 },
  { nome: 'Vibo Valentia',   tipo: 'Fibra', banda: 11,  pktLoss: 0.0, so115: 0 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATI PROVINCIALI — SCENARIO ANOMALIA (ATTACCO INFORMATICO)
// Fibra satura senza correlazione con attività SO115 → anomalia operativa
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sicilia — Anomalia ────────────────────────────────────────────────────────
// C.P. Palermo: Fibra saturata al 91% — traffico anomalo sull'uplink,
//   nessun incidente in corso → anomalia informatica
// C.P. Catania: Fibra saturata all'89% — stessa origine (propagazione attacco)
// C.P. Messina: Fibra al 74% in degradazione, congestione parziale
// C.P. Agrigento/Caltanissetta/Enna/Ragusa/Siracusa/Trapani: non interessati
const PROV_SIC_ANOMALIA = [
  { nome: 'Palermo',       tipo: 'Fibra', banda: 91, pktLoss: 5.4, so115: 0 },
  { nome: 'Catania',       tipo: 'Fibra', banda: 89, pktLoss: 4.9, so115: 0 },
  { nome: 'Messina',       tipo: 'Fibra', banda: 74, pktLoss: 3.1, so115: 0 },
  { nome: 'Agrigento',     tipo: 'Fibra', banda: 14, pktLoss: 0.2, so115: 0 },
  { nome: 'Caltanissetta', tipo: 'Fibra', banda: 12, pktLoss: 0.1, so115: 0 },
  { nome: 'Enna',          tipo: 'Fibra', banda: 8,  pktLoss: 0.0, so115: 0 },
  { nome: 'Ragusa',        tipo: 'Fibra', banda: 10, pktLoss: 0.1, so115: 0 },
  { nome: 'Siracusa',      tipo: 'Fibra', banda: 9,  pktLoss: 0.0, so115: 0 },
  { nome: 'Trapani',       tipo: 'Fibra', banda: 7,  pktLoss: 0.0, so115: 0 },
];

// ── Calabria — Anomalia ───────────────────────────────────────────────────────
// C.P. Catanzaro: Fibra saturata al 92% — origine attacco informatico
// C.P. Cosenza: Fibra saturata al 88% — propagazione
// C.P. Reggio Calabria: Fibra saturata al 85% — propagazione
// C.P. Crotone: Fibra al 72%, parzialmente interessato
// C.P. Vibo Valentia: non interessato
const PROV_CAL_ANOMALIA = [
  { nome: 'Catanzaro',       tipo: 'Fibra', banda: 92, pktLoss: 6.3, so115: 0 },
  { nome: 'Cosenza',         tipo: 'Fibra', banda: 88, pktLoss: 5.7, so115: 0 },
  { nome: 'Reggio Calabria', tipo: 'Fibra', banda: 85, pktLoss: 5.1, so115: 0 },
  { nome: 'Crotone',         tipo: 'Fibra', banda: 72, pktLoss: 3.2, so115: 0 },
  { nome: 'Vibo Valentia',   tipo: 'Fibra', banda: 18, pktLoss: 0.3, so115: 0 },
];

// ── Puglia — Anomalia ─────────────────────────────────────────────────────────
// C.P. Bari: DSL al 98% (link quasi saturo) — anomalia su accesso DSL,
//   nessun incidente correlato
// Altri comandi non interessati
const PROV_PUG_ANOMALIA = [
  { nome: 'Bari',          tipo: 'DSL',   banda: 7.9, pktLoss: 3.4, so115: 0 },
  { nome: 'Foggia',        tipo: 'Fibra', banda: 14,  pktLoss: 0.1, so115: 0 },
  { nome: 'Taranto',       tipo: 'Fibra', banda: 11,  pktLoss: 0.0, so115: 0 },
  { nome: 'Lecce',         tipo: 'Fibra', banda: 13,  pktLoss: 0.1, so115: 0 },
  { nome: 'Brindisi',      tipo: 'Fibra', banda: 9,   pktLoss: 0.0, so115: 0 },
  { nome: 'BAT',           tipo: 'Fibra', banda: 10,  pktLoss: 0.0, so115: 0 },
];

// ── Aggregazioni ──────────────────────────────────────────────────────────────
const PROVINCES_NISCEMI  = { 'Sicilia': PROV_SIC_NISCEMI,  'Calabria': PROV_CAL_NISCEMI };
const PROVINCES_ANOMALIA = { 'Sicilia': PROV_SIC_ANOMALIA, 'Calabria': PROV_CAL_ANOMALIA, 'Puglia': PROV_PUG_ANOMALIA };

// ── SCENARIO 1: Normale ───────────────────────────────────────────────────────
function generateNormal() {
  return ACTIVE_REGIONS.map(reg =>
    buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3))
  );
}

// ── SCENARIO 2: Frana di Niscemi (CL) — 14/03/2025 ───────────────────────────
// D.R. Sicilia: LTE (peggioramento aggregato di regione per emergenza CL)
// D.R. Calabria: DSL (congestione backbone sud)
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

// ── SCENARIO 3: Anomalia Operativa — Attacco Informatico ─────────────────────
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
    provs:           [],                          // niente pallini, solo X epicentro
    epicenter:       EPICENTER_NISCEMI,
    criticalRegions: ['Sicilia', 'Calabria'],
    provinces:       PROVINCES_NISCEMI,
    supreme: {
      codem:   'EM-2025-031',
      evento:  'Frana Niscemi — Caltanissetta (CL)',
      livello: 'REGIONALE',
      moduli: {
        'MS.ICT': {
          stato:       'ALLERTATO',
          personale:   '3 TLC + 3 Inf.',
          mezzi:       ['PRT (ponti radio)', 'CRT/SRC (satellite)', 'Auto connettività'],
          impedimenti: ['Veicolo PRT in manutenzione presso officina CL'],
        },
        'MS.COEM': {
          stato:       'PRONTO',
          personale:   '2 addetti COEM',
          mezzi:       ['Mezzo attrezzato comunicazioni'],
          impedimenti: [],
        },
        'MS.TAST': {
          stato:       'PRONTO',
          personale:   '1 ICT',
          mezzi:       ['Autovettura'],
          impedimenti: [],
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
