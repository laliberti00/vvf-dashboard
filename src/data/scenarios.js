import { ACTIVE_REGIONS, CAP } from './constants';

// ── Helper ────────────────────────────────────────────────────────────────────
function rn(a, b) { return Math.round(a + Math.random() * (b - a)); }

// ── Marcatori mappa per scenari con evento localizzato ────────────────────────
const PROV_MARKERS_SISMA_2016 = [
  { name: 'Rieti',     x: 340, y: 370 },
  { name: 'Perugia',   x: 305, y: 330 },
  { name: 'Ascoli P.', x: 380, y: 325 },
  { name: 'Teramo',    x: 375, y: 310 },
  { name: "L'Aquila",  x: 350, y: 340 },
  { name: 'Macerata',  x: 365, y: 300 },
];
const EPICENTER_SISMA_2016 = { x: 362, y: 332 };

// ── Generatori dati per sede ──────────────────────────────────────────────────
// Ogni sede ha: { reg, link, tipo, banda, cap, so115 }
// sat e sit vengono calcolati dalla dashboard tramite getSituation (non duplicati qui)

function buildSite(reg, tipo, banda, link, so115) {
  return { reg, link, tipo, banda, cap: CAP[tipo], so115 };
}

// ── SCENARIO: Normale ─────────────────────────────────────────────────────────
function generateNormal() {
  return ACTIVE_REGIONS.map(reg =>
    buildSite(reg, 'Fibra', rn(8, 30), 'UP', rn(0, 3))
  );
}

// ── SCENARIO: Sisma Centro Italia 24/08/2016 ─────────────────────────────────
function generateSisma2016() {
  const critiche  = ['Lazio', 'Umbria', 'Marche', 'Abruzzo'];  // DOWN → LTE
  const degradate = ['Toscana', 'Molise'];                      // DEGRADATO → DSL

  return ACTIVE_REGIONS.map(reg => {
    if (critiche.includes(reg))
      return buildSite(reg, 'LTE',   rn(3,  4),  'DOWN',      rn(18, 35));
    if (degradate.includes(reg))
      return buildSite(reg, 'DSL',   rn(5,  7),  'DEGRADATO', rn(6,  14));
    return   buildSite(reg, 'Fibra', rn(8,  35), 'UP',        rn(0,  4));
  });
}

// ── Trend (30 campioni = 30 minuti) ──────────────────────────────────────────
// Formato: array[30] di { latenza_ms, pktLoss_pct }

function zipTrend(latArr, pktArr) {
  return latArr.map((lat, i) => ({ latenza: lat, pktLoss: pktArr[i] }));
}

const trendNormale = zipTrend(
  Array.from({ length: 30 }, () => rn(8, 16)),
  Array.from({ length: 30 }, () => +(Math.random() * 0.4).toFixed(1))
);

const trendSisma2016 = zipTrend(
  [14,18,25,35,48,62,78,95,110,130,148,165,175,190,200,210,218,225,235,240,248,255,260,258,265,270,275,280,278,275],
  [0.3,0.5,0.8,1.2,1.8,2.5,3.2,3.8,4.5,5.0,5.5,6.0,6.2,6.5,6.8,7.0,7.2,7.5,7.3,7.6,7.8,8.0,8.2,8.0,8.3,8.5,8.7,9.0,8.8,8.7]
);

// ── Registro scenari ──────────────────────────────────────────────────────────
// Aggiungere nuovi scenari qui, senza toccare Dashboard.js
//
// Struttura di uno scenario:
//   id:        chiave univoca
//   label:     testo del pulsante UI
//   badge:     testo del badge di stato
//   badgeClass: 'badge-ok' | 'badge-crit'
//   data:      array di sedi (generato da una funzione generate*)
//   trend:     array[30] di { latenza, pktLoss }
//   provs:     array di marcatori mappa ([] se nessuno)
//   epicenter: { x, y } | null
//   criticalRegions: array di nomi regione evidenziate per zoom automatico
//
export const SCENARIOS = {
  normal: {
    id:              'normal',
    label:           'Normale',
    badge:           'Operativo',
    badgeClass:      'badge-ok',
    data:            generateNormal(),
    trend:           trendNormale,
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
    trend:           trendSisma2016,
    provs:           PROV_MARKERS_SISMA_2016,
    epicenter:       EPICENTER_SISMA_2016,
    criticalRegions: ['Lazio', 'Umbria', 'Marche', 'Abruzzo'],
  },
};
