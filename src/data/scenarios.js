import { ACTIVE_REGIONS, CAP } from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function rn(a, b) { return Math.round(a + Math.random() * (b - a)); }
function rf(a, b) { return +((a + Math.random() * (b - a)).toFixed(2)); }

// ── Trend per sede ────────────────────────────────────────────────────────────
// Genera 30 campioni {latenza, pktLoss} realistici in funzione del tipo e della
// saturazione della sede. Usato per il grafico trend vincolato alla selezione.
function generateSiteTrend(tipo, sat) {
  return Array.from({ length: 30 }, (_, i) => {
    let latenza, pktLoss;

    if (tipo === 'LTE') {
      // Latenza alta e in leggero peggioramento nel tempo
      latenza = Math.min(500, Math.round(160 + i * 4 + rn(-15, 25)));
      pktLoss = rf(5, 13);
    } else if (tipo === 'DSL') {
      // Latenza media, packet loss moderato
      latenza = rn(45, 90);
      pktLoss = rf(1.0, 4.0);
    } else if (sat >= 80) {
      // Fibra satura: latenza crescente (anomalia/congestione)
      latenza = Math.min(400, Math.round(35 + i * 2.8 + rn(-8, 18)));
      pktLoss = rf(2.0, 8.0);
    } else if (sat >= 50) {
      // Fibra sotto stress
      latenza = rn(15, 45);
      pktLoss = rf(0.3, 1.5);
    } else {
      // Fibra ok
      latenza = rn(4, 18);
      pktLoss = rf(0.0, 0.4);
    }

    return { latenza, pktLoss };
  });
}

// ── Builder sede ──────────────────────────────────────────────────────────────
// Costruisce un oggetto sede normalizzato. Il campo `sat` viene precalcolato
// per passarlo a generateSiteTrend; la Dashboard lo ricalcola tramite getSituation
// per avere sit/sat sempre derivati dalla stessa funzione.
function buildSite(reg, tipo, banda, pktLoss, so115) {
  const cap = CAP[tipo];
  const sat = Math.round(banda / cap * 100);
  return { reg, tipo, banda, cap, pktLoss, so115, trend: generateSiteTrend(tipo, sat) };
}

// ── Marcatori mappa ───────────────────────────────────────────────────────────
const PROV_MARKERS_SISMA_2016 = [
  { name: 'Rieti',     x: 340, y: 370 },
  { name: 'Perugia',   x: 305, y: 330 },
  { name: 'Ascoli P.', x: 380, y: 325 },
  { name: 'Teramo',    x: 375, y: 310 },
  { name: "L'Aquila",  x: 350, y: 340 },
  { name: 'Macerata',  x: 365, y: 300 },
];
const EPICENTER_SISMA_2016 = { x: 362, y: 332 };

// ── SCENARIO 1: Normale ───────────────────────────────────────────────────────
function generateNormal() {
  return ACTIVE_REGIONS.map(reg =>
    buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3))
  );
}

// ── SCENARIO 2: Sisma Centro Italia 24/08/2016 ────────────────────────────────
function generateSisma2016() {
  const critiche  = ['Lazio', 'Umbria', 'Marche', 'Abruzzo']; // → LTE
  const degradate = ['Toscana', 'Molise'];                     // → DSL

  return ACTIVE_REGIONS.map(reg => {
    if (critiche.includes(reg))
      return buildSite(reg, 'LTE',   rn(3, 4),  rf(5.0, 14.0), rn(18, 35));
    if (degradate.includes(reg))
      return buildSite(reg, 'DSL',   rn(5, 7),  rf(1.0,  4.0), rn(6,  14));
    return   buildSite(reg, 'Fibra', rn(8, 35), rf(0.0,  0.4), rn(0,   4));
  });
}

// ── SCENARIO 3: Anomalia Operativa — Attacco Informatico (Calabria) ───────────
// Tre sedi con degrado/emergenza da saturazione Fibra, senza alcun intervento
// SO115 a giustificarlo → alta presenza in Q3 (anomalie operative).
// Dimostra che EMERGENZA può derivare da saturazione e non solo da tecnologia LTE.
function generateAnomaliaCalabria() {
  const anomale = {
    // EMERGENZA da saturazione (Fibra ≥ 80%): nessun evento giustificante
    'Calabria': { tipo: 'Fibra', banda: rn(88, 93), pktLoss: rf(3.0, 8.0), so115: 0 },
    'Sicilia':  { tipo: 'Fibra', banda: rn(84, 91), pktLoss: rf(2.5, 7.0), so115: 0 },
    // DEGRADATO/EMERGENZA su DSL senza SO115
    'Puglia':   { tipo: 'DSL',   banda: rn(7,  8),  pktLoss: rf(1.5, 4.0), so115: 0 },
  };

  return ACTIVE_REGIONS.map(reg => {
    const a = anomale[reg];
    if (a) return buildSite(reg, a.tipo, a.banda, a.pktLoss, a.so115);
    return buildSite(reg, 'Fibra', rn(8, 30), rf(0.0, 0.4), rn(0, 3));
  });
}

// ── Registro scenari ──────────────────────────────────────────────────────────
// Per aggiungere un nuovo scenario: definire una funzione generate* e aggiungere
// una voce qui. Dashboard.js non va mai modificato.
//
// Struttura di uno scenario:
//   id, label, badge, badgeClass
//   data:            array[18] di sedi — ogni sede: { reg, tipo, banda, cap, pktLoss, so115, trend[30] }
//   provs:           marcatori mappa [ { name, x, y } ] ([] se nessuno)
//   epicenter:       { x, y } | null
//   criticalRegions: nomi regioni per zoom automatico su selezione
//
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
  },

  sisma2016: {
    id:              'sisma2016',
    label:           'Emergenza — Sisma 2016',
    badge:           'Emergenza — Sisma Centro Italia 24/08/2016',
    badgeClass:      'badge-crit',
    data:            generateSisma2016(),
    provs:           PROV_MARKERS_SISMA_2016,
    epicenter:       EPICENTER_SISMA_2016,
    criticalRegions: ['Lazio', 'Umbria', 'Marche', 'Abruzzo'],
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
  },
};
