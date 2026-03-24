import { ACTIVE_REGIONS, CAP, PROVINCE } from './constants';

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

// ── Builder provincia ─────────────────────────────────────────────────────────
function buildProv(prov, tipo, banda, pktLoss, so115, distaccamenti) {
  return { prov, tipo, banda, cap: CAP[tipo], pktLoss, so115, distaccamenti };
}

// ── Province di default (fibra normale) ───────────────────────────────────────
function generateDefaultProvinces(reg) {
  return (PROVINCE[reg] || []).map(prov =>
    buildProv(prov, 'Fibra', rn(8, 25), rf(0.0, 0.3), rn(0, 2), rn(4, 12))
  );
}

// ── Builder sede ──────────────────────────────────────────────────────────────
function buildSite(reg, tipo, banda, pktLoss, so115, province = null) {
  const cap = CAP[tipo];
  const sat = Math.round(banda / cap * 100);
  return {
    reg, tipo, banda, cap, pktLoss, so115,
    trend:    generateSiteTrend(tipo, sat),
    province: province !== null ? province : generateDefaultProvinces(reg),
  };
}

// ── Province personalizzate per scenario Niscemi (Sicilia) ────────────────────
const PROV_NISCEMI_SICILIA = [
  buildProv('Caltanissetta', 'LTE',   3,           rf(7.0, 12.0), rn(24, 30), 6),
  buildProv('Agrigento',     'DSL',   6,           rf(1.5,  3.5), rn(8,  14), 8),
  buildProv('Ragusa',        'DSL',   7,           rf(1.0,  3.0), rn(6,  10), 7),
  buildProv('Palermo',       'Fibra', rn(15, 25),  rf(0.0,  0.3), rn(1,   3), 15),
  buildProv('Catania',       'Fibra', rn(12, 22),  rf(0.0,  0.3), rn(0,   2), 12),
  buildProv('Messina',       'Fibra', rn(10, 20),  rf(0.0,  0.3), rn(0,   2), 11),
  buildProv('Siracusa',      'Fibra', rn(8,  18),  rf(0.0,  0.3), rn(0,   2), 7),
  buildProv('Trapani',       'Fibra', rn(8,  16),  rf(0.0,  0.3), rn(0,   2), 8),
  buildProv('Enna',          'Fibra', rn(6,  14),  rf(0.0,  0.3), rn(0,   2), 5),
];

// ── Province personalizzate per scenario Anomalia Calabria ────────────────────
const PROV_ANOMALIA_CALABRIA = [
  buildProv('Reggio Calabria', 'Fibra', rn(88, 93), rf(3.0, 8.0), 0, 10),
  buildProv('Catanzaro',       'Fibra', rn(84, 91), rf(2.5, 7.0), 0, 7),
  buildProv('Cosenza',         'Fibra', rn(10, 25), rf(0.0, 0.3), rn(0, 2), 9),
  buildProv('Crotone',         'DSL',   rn(6,  8),  rf(1.5, 4.0), 0, 5),
  buildProv('Vibo Valentia',   'Fibra', rn(8,  20), rf(0.0, 0.3), rn(0, 2), 4),
];

// ── Marcatori mappa ───────────────────────────────────────────────────────────
const PROV_MARKERS_NISCEMI = [
  { name: 'Caltanissetta', x: 393, y: 657 },
  { name: 'Agrigento',     x: 362, y: 668 },
  { name: 'Ragusa',        x: 415, y: 672 },
];
const EPICENTER_NISCEMI = { x: 407, y: 665 }; // Niscemi (CL)

// ── SUPREME — struttura vuota (nessuna emergenza) ─────────────────────────────
const SUPREME_VUOTO = { codem: null, evento: null, livello: null, moduli: [] };

// ── SUPREME — Frana di Niscemi ────────────────────────────────────────────────
const SUPREME_NISCEMI = {
  codem:   'EM-2025-031',
  evento:  'Frana di Niscemi (CL)',
  livello: 'S2_Regionale',
  moduli: [
    {
      tipo:         'MS.ICT',
      stato:        'ALLERTATO',
      fase:         'Potenziamento',
      regione:      'Sicilia',
      origine:      'Palermo',
      destinazione: 'DOA — Caltanissetta',
      personale:    { disponibile: 5, totale: 6 },
      mezzi:        { prt: true, crt: true, auto: false },
      autonomia_gg: 7,
      impedimento:  'Veicolo leggero in manutenzione',
    },
    {
      tipo:         'MS.COEM',
      stato:        'IN_PARTENZA',
      fase:         'Potenziamento',
      regione:      'Sicilia',
      origine:      'Catania',
      destinazione: 'DOA — Caltanissetta',
      personale:    { disponibile: 2, totale: 2 },
      mezzi:        null,
      autonomia_gg: 7,
      impedimento:  null,
    },
    {
      tipo:         'MS.TAST',
      stato:        'DISPIEGATO',
      fase:         'Immediata',
      regione:      'Sicilia',
      origine:      'Palermo',
      destinazione: 'DOA — Caltanissetta',
      personale:    { disponibile: 1, totale: 1 },
      mezzi:        null,
      autonomia_gg: 7,
      impedimento:  null,
    },
  ],
};

// ── SCENARIO 1: Normale ───────────────────────────────────────────────────────
function generateNormal() {
  return ACTIVE_REGIONS.map(reg =>
    buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3))
  );
}

// ── SCENARIO 2: Frana di Niscemi (CL) — 2025 ─────────────────────────────────
function generateNiscemi() {
  return ACTIVE_REGIONS.map(reg => {
    if (reg === 'Sicilia')
      return buildSite(reg, 'LTE',   rn(3, 4),  rf(5.0, 14.0), rn(22, 30), PROV_NISCEMI_SICILIA);
    return buildSite(reg, 'Fibra', rn(8, 35), rf(0.0,  0.4),  rn(0,  4));
  });
}

// ── SCENARIO 3: Anomalia Operativa — Attacco Informatico (Calabria) ───────────
function generateAnomaliaCalabria() {
  const anomale = {
    'Calabria': { tipo: 'Fibra', banda: rn(88, 93), pktLoss: rf(3.0, 8.0), so115: 0, province: PROV_ANOMALIA_CALABRIA },
    'Sicilia':  { tipo: 'Fibra', banda: rn(84, 91), pktLoss: rf(2.5, 7.0), so115: 0, province: null },
    'Puglia':   { tipo: 'DSL',   banda: rn(7,  8),  pktLoss: rf(1.5, 4.0), so115: 0, province: null },
  };

  return ACTIVE_REGIONS.map(reg => {
    const a = anomale[reg];
    if (a) return buildSite(reg, a.tipo, a.banda, a.pktLoss, a.so115, a.province);
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
    supreme:         SUPREME_VUOTO,
  },

  niscemi: {
    id:              'niscemi',
    label:           'Emergenza — Frana Niscemi',
    badge:           'Emergenza — Frana di Niscemi (CL) — 2025',
    badgeClass:      'badge-crit',
    data:            generateNiscemi(),
    provs:           PROV_MARKERS_NISCEMI,
    epicenter:       EPICENTER_NISCEMI,
    criticalRegions: ['Sicilia'],
    supreme:         SUPREME_NISCEMI,
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
    supreme:         SUPREME_VUOTO,
  },
};
