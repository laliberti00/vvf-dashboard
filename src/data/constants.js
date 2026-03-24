// ── Regioni ───────────────────────────────────────────────────────────────────

export const ID_TO_IT = {
  'abruzzo':               'Abruzzo',
  'aosta-valley':          "Valle d'Aosta",
  'apulia':                'Puglia',
  'basilicata':            'Basilicata',
  'calabria':              'Calabria',
  'campania':              'Campania',
  'emilia-romagna':        'Emilia-Romagna',
  'friuli-venezia-giulia': 'Friuli-Venezia Giulia',
  'lazio':                 'Lazio',
  'liguria':               'Liguria',
  'lombardy':              'Lombardia',
  'marche':                'Marche',
  'molise':                'Molise',
  'piedmont':              'Piemonte',
  'sardinia':              'Sardegna',
  'sicily':                'Sicilia',
  'trentino-south-tyrol':  'Trentino-Alto Adige',
  'tuscany':               'Toscana',
  'umbria':                'Umbria',
  'veneto':                'Veneto',
};

// 18 regioni con sede operativa CNVVF
export const ACTIVE_REGIONS = [
  'Piemonte', 'Liguria', 'Lombardia', 'Veneto', 'Friuli-Venezia Giulia', 'Emilia-Romagna',
  'Toscana', 'Umbria', 'Marche', 'Lazio', 'Abruzzo', 'Molise',
  'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna',
];

// Escluse: nessuna sede CNVVF di primo livello
export const EXCLUDED = ["Valle d'Aosta", "Trentino-Alto Adige"];

// ── Tecnologie WAN ────────────────────────────────────────────────────────────
// Capacità massima per tipo di collegamento (Mbps)
export const CAP = {
  Fibra: 100,
  DSL:   8,
  LTE:   4,
};

// ── Soglie operative (usate da getSituation e dai quadranti) ──────────────────
export const SOGLIE = {
  sat_emergenza:  80,   // % saturazione → EMERGENZA
  sat_degradato:  50,   // % saturazione → DEGRADATO
  so115_rischio:  5,    // Q2: degradato con SO115 > soglia → sede a rischio
  so115_anomalia: 1,    // Q3: degrado/emergenza con SO115 ≤ soglia → anomalia
  trend_delta:    8,    // Q4: delta % saturazione media → peggioramento
};

// ── Colori UI ─────────────────────────────────────────────────────────────────
export const COL = {
  ok:       '#a5d6a7',
  okStroke: '#4caf50',
  warning:  '#ffcc80',
  warnStroke: '#ff9800',
  critical: '#ef9a9a',
  critStroke: '#ef5350',
  excluded: '#e8e8e8',
  faded:    '#f2f2f2',
  vvf:      '#C1272D',
};

// ── Ordinamento situazione ────────────────────────────────────────────────────
export const SIT_ORDER = { EMERGENZA: 0, DEGRADATO: 1, OPERATIVO: 2 };

// ── Moduli CMR — stati e colori ───────────────────────────────────────────────
export const MOD_STATO_LABEL = {
  PRONTO:          'Pronto',
  ALLERTATO:       'Allertato',
  IMPEGNATO:       'In Missione',
  NON_DISPONIBILE: 'Non Disponibile',
};
export const MOD_STATO_COLOR = {
  PRONTO:          '#4caf50',
  ALLERTATO:       '#ff9800',
  IMPEGNATO:       '#1976d2',
  NON_DISPONIBILE: '#ef5350',
};
