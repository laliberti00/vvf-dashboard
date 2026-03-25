import { ACTIVE_REGIONS, CAP } from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function rn(a, b) { return Math.round(a + Math.random() * (b - a)); }
function rf(a, b) { return +((a + Math.random() * (b - a)).toFixed(2)); }

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

function buildSite(reg, tipo, banda, pktLoss, so115) {
  const cap = CAP[tipo];
  const sat = Math.round(banda / cap * 100);
  return { reg, tipo, banda, cap, pktLoss, so115, trend: generateSiteTrend(tipo, sat) };
}

// ── Epicentro mappa — solo X, senza pallini ───────────────────────────────────
// Coordinate SVG Sicilia: bbox reale X:272→463, Y:580→792
// Niscemi si trova al confine CL/RG, zona centro-sud
const EPICENTER_NISCEMI = { x: 362, y: 698 };

// ═══════════════════════════════════════════════════════════════════════════════
// DATI PROVINCIALI
// Struttura: { nome, tipo, banda, pktLoss, so115 }
// cap = CAP[tipo], sat = banda/cap*100 — calcolati in Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sicilia — Frana Niscemi ───────────────────────────────────────────────────
// C.P. Caltanissetta: LTE (antenna fibra divelta dalla frana, fallback 4G),
//   18 interventi SO115 attivi (squadre sul posto + richieste in arrivo)
// C.P. Agrigento: DSL (linea PTT degradata, traffico overflow da Caltanissetta),
//   8 interventi SO115 (supporto bordo area colpita)
// C.P. Ragusa: DSL, 6 interventi (supporto logistico)
// C.P. Catania: Fibra al 44% — traffico in salita per relay comunicazioni
//   d'emergenza, proiezione a 30min sfiora DEGRADATO
// C.P. Enna: Fibra al 43% — backbone di transito verso Caltanissetta
//   sotto pressione, in peggioramento
// C.P. Palermo: Fibra OK — sede D.R. Sicilia, coordinamento regionale
// C.P. Messina, Siracusa, Trapani: stabili, nessun coinvolgimento
const PROV_SIC_NISCEMI = [
  { nome: 'Caltanissetta', tipo: 'LTE',   banda: 3.2, pktLoss: 9.1, so115: 18 },
  { nome: 'Agrigento',     tipo: 'DSL',   banda: 6.4, pktLoss: 2.9, so115: 8  },
  { nome: 'Ragusa',        tipo: 'DSL',   banda: 6.1, pktLoss: 2.3, so115: 6  },
  { nome: 'Catania',       tipo: 'Fibra', banda: 44,  pktLoss: 0.8, so115: 3  },
  { nome: 'Enna',          tipo: 'Fibra', banda: 43,  pktLoss: 0.7, so115: 3  },
  { nome: 'Palermo',       tipo: 'Fibra', banda: 28,  pktLoss: 0.3, so115: 2  },
  { nome: 'Messina',       tipo: 'Fibra', banda: 15,  pktLoss: 0.2, so115: 1  },
  { nome: 'Siracusa',      tipo: 'Fibra', banda: 9,   pktLoss: 0.1, so115: 1  },
  { nome: 'Trapani',       tipo: 'Fibra', banda: 8,   pktLoss: 0.0, so115: 0  },
];

// ── Calabria — Frana Niscemi ──────────────────────────────────────────────────
// Il backbone meridionale è congestionato per il traffico di gestione
// emergenza che transita sui nodi di Catanzaro e Crotone
// C.P. Catanzaro: DSL (il link istituzionale è DSL — infrastruttura più datata)
// C.P. Crotone: DSL, stessa causa
// Altri: stabili
const PROV_CAL_NISCEMI = [
  { nome: 'Catanzaro',       tipo: 'DSL',   banda: 5.8, pktLoss: 2.2, so115: 7 },
  { nome: 'Crotone',         tipo: 'DSL',   banda: 6.2, pktLoss: 1.9, so115: 5 },
  { nome: 'Cosenza',         tipo: 'Fibra', banda: 18,  pktLoss: 0.2, so115: 2 },
  { nome: 'Reggio Calabria', tipo: 'Fibra', banda: 21,  pktLoss: 0.1, so115: 1 },
  { nome: 'Vibo Valentia',   tipo: 'Fibra', banda: 11,  pktLoss: 0.0, so115: 0 },
];

// ── Calabria — Anomalia Operativa ─────────────────────────────────────────────
// Tutti i C.P. mostrano Fibra satura senza alcuna attività SO115 correlata
// Nessuna emergenza SUPREME attiva → anomalia operativa (possibile attacco cyber
// o saturazione artificiale del backbone)
const PROV_CAL_ANOMALIA = [
  { nome: 'Catanzaro',       tipo: 'Fibra', banda: 92, pktLoss: 6.3, so115: 0 },
  { nome: 'Cosenza',         tipo: 'Fibra', banda: 88, pktLoss: 5.7, so115: 0 },
  { nome: 'Reggio Calabria', tipo: 'Fibra', banda: 85, pktLoss: 5.1, so115: 0 },
  { nome: 'Crotone',         tipo: 'Fibra', banda: 72, pktLoss: 3.2, so115: 0 },
  { nome: 'Vibo Valentia',   tipo: 'Fibra', banda: 18, pktLoss: 0.3, so115: 0 },
];

// ── Aggregazioni per scenari ──────────────────────────────────────────────────
const PROVINCES_NISCEMI  = { 'Sicilia': PROV_SIC_NISCEMI, 'Calabria': PROV_CAL_NISCEMI };
const PROVINCES_ANOMALIA = { 'Calabria': PROV_CAL_ANOMALIA };

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1: Normale
// Qualche regione DSL per realismo, tutto sostanzialmente operativo
// ═══════════════════════════════════════════════════════════════════════════════
function generateNormal() {
  const dsl = {
    // Molise e Basilicata storicamente su DSL per bassa densità infrastrutturale
    'Molise':     { banda: rn(5, 7),  pktLoss: rf(1.0, 2.8), so115: rn(1, 3) },
    'Basilicata': { banda: rn(5, 6),  pktLoss: rf(0.8, 2.2), so115: rn(0, 2) },
  };
  return ACTIVE_REGIONS.map(reg => {
    const d = dsl[reg];
    if (d) return buildSite(reg, 'DSL', d.banda, d.pktLoss, d.so115);
    return buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 2: Frana di Niscemi (CL) — 14/03/2025
//
// La D.R. Sicilia ha sede a Palermo → OPERATIVA (Fibra stabile)
// L'emergenza è a livello C.P. Caltanissetta (LTE)
// Il triangolo EM01 compare sulla Sicilia per invitare ad aprire il dettaglio
//
// D.R. Calabria: Fibra 68% (backbone congestionato) → DEGRADATO
//   proiezione a +30min: 80% → EMERGENZA (Q4 mostra peggioramento)
// D.R. Campania: Fibra 55% (pressione backbone sud) → DEGRADATO
// ═══════════════════════════════════════════════════════════════════════════════
function generateNiscemi() {
  const overrides = {
    'Sicilia':  { tipo: 'Fibra', banda: 18,  pktLoss: rf(0.1, 0.3), so115: rn(2, 5) },
    'Calabria': { tipo: 'Fibra', banda: 68,  pktLoss: rf(1.2, 2.5), so115: rn(5, 12) },
    'Campania': { tipo: 'Fibra', banda: 55,  pktLoss: rf(0.5, 1.2), so115: rn(3, 7) },
  };
  return ACTIVE_REGIONS.map(reg => {
    const o = overrides[reg];
    if (o) return buildSite(reg, o.tipo, o.banda, o.pktLoss, o.so115);
    return buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 4));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3: Anomalia Operativa — Calabria
//
// Solo Calabria presenta Fibra satura (88-93%) con SO115=0
// Nessuna emergenza SUPREME attiva → ANOMALIA OPERATIVA
// Le altre regioni sono regolari
// ═══════════════════════════════════════════════════════════════════════════════
function generateAnomaliaCalabria() {
  return ACTIVE_REGIONS.map(reg => {
    if (reg === 'Calabria')
      return buildSite(reg, 'Fibra', rn(88, 93), rf(3.0, 8.0), 0);
    return buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3));
  });
}

// ── Registro scenari ──────────────────────────────────────────────────────────
// supremeRegions: regioni con CODEM EM01 attivo (triangolo di allerta sulla mappa)
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
    supremeRegions:  [],
    provinces:       {},
    supreme:         null,
  },

  niscemi: {
    id:              'niscemi',
    label:           'Emergenza — Frana Niscemi',
    badge:           'Emergenza — Frana Niscemi (CL) 14/03/2025',
    badgeClass:      'badge-crit',
    data:            generateNiscemi(),
    provs:           [],
    epicenter:       EPICENTER_NISCEMI,
    criticalRegions: ['Sicilia', 'Calabria', 'Campania'],
    supremeRegions:  ['Sicilia'],   // CODEM EM01 attivo solo per Sicilia
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
    label:           'Anomalia — Calabria',
    badge:           'Anomalia Operativa — Saturazione Fibra (Calabria)',
    badgeClass:      'badge-crit',
    data:            generateAnomaliaCalabria(),
    provs:           [],
    epicenter:       null,
    criticalRegions: ['Calabria'],
    supremeRegions:  [],            // Nessun CODEM attivo
    provinces:       PROVINCES_ANOMALIA,
    supreme: {
      codem:   null,
      evento:  null,
      livello: null,
      moduli:  null,
    },
  },
};
