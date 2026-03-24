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

// ── Province per regione (Comandi Provinciali CNVVF) ──────────────────────────
export const PROVINCE = {
  'Piemonte':              ['Torino','Cuneo','Asti','Alessandria','Novara','Biella','Vercelli','Verbano-Cusio-Ossola'],
  'Liguria':               ['Genova','La Spezia','Savona','Imperia'],
  'Lombardia':             ['Milano','Bergamo','Brescia','Como','Cremona','Lecco','Lodi','Mantova','Monza-Brianza','Pavia','Sondrio','Varese'],
  'Veneto':                ['Venezia','Verona','Vicenza','Padova','Treviso','Belluno','Rovigo'],
  'Friuli-Venezia Giulia': ['Trieste','Udine','Pordenone','Gorizia'],
  'Emilia-Romagna':        ['Bologna','Modena','Parma','Reggio Emilia','Ferrara','Ravenna','Rimini','Forlì-Cesena','Piacenza'],
  'Toscana':               ['Firenze','Siena','Pisa','Livorno','Arezzo','Grosseto','Pistoia','Prato','Massa-Carrara','Lucca'],
  'Umbria':                ['Perugia','Terni'],
  'Marche':                ['Ancona','Pesaro-Urbino','Ascoli Piceno','Fermo','Macerata'],
  'Lazio':                 ['Roma','Latina','Frosinone','Viterbo','Rieti'],
  'Abruzzo':               ["L'Aquila",'Chieti','Pescara','Teramo'],
  'Molise':                ['Campobasso','Isernia'],
  'Campania':              ['Napoli','Salerno','Avellino','Benevento','Caserta'],
  'Puglia':                ['Bari','Foggia','Brindisi','Lecce','Taranto','Barletta-Andria-Trani'],
  'Basilicata':            ['Potenza','Matera'],
  'Calabria':              ['Reggio Calabria','Catanzaro','Cosenza','Crotone','Vibo Valentia'],
  'Sicilia':               ['Palermo','Catania','Messina','Siracusa','Trapani','Agrigento','Caltanissetta','Ragusa','Enna'],
  'Sardegna':              ['Cagliari','Sassari','Nuoro','Oristano','Sud Sardegna'],
};

// ── Moduli CMR — stati e colori ───────────────────────────────────────────────
export const MOD_STATO_LABEL = {
  DISPIEGATO:   'Dispiegato',
  IN_PARTENZA:  'In Partenza',
  ALLERTATO:    'Allertato',
  NON_ATTIVATO: 'Non Attivato',
  IMPEDITO:     'Impedito',
};

export const MOD_STATO_COLOR = {
  DISPIEGATO:   '#4caf50',
  IN_PARTENZA:  '#ff9800',
  ALLERTATO:    '#1976d2',
  NON_ATTIVATO: '#999',
  IMPEDITO:     '#ef5350',
};
