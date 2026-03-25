import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import regionsRaw from './italyRegions.json';
import logoVvf from './logo_vvf.png';
import './dashboard.css';

import { ACTIVE_REGIONS, EXCLUDED, ID_TO_IT, COL, SOGLIE, SIT_ORDER, MOD_STATO_LABEL, MOD_STATO_COLOR, CAP } from './data/constants';
import { getSituation, sitStroke, sitFill } from './data/getSituation';
import { SCENARIOS } from './data/scenarios';

const svgRegions = regionsRaw.map(([id, engName, path]) => ({
  id, engName, italianName: ID_TO_IT[id] || engName, path
}));

const SORTED_REGIONS = [...ACTIVE_REGIONS].sort((a, b) => a.localeCompare(b, 'it'));

// ── Logica di raccomandazione per il Direttore Regionale ─────────────────────
function computeProvSit(p) {
  const cap = CAP[p.tipo] || 100;
  const sat = Math.round(p.banda / cap * 100);
  if (p.tipo === 'LTE' || sat >= 80) return 'EMERGENZA';
  if (p.tipo === 'DSL' || sat >= 50) return 'DEGRADATO';
  return 'OPERATIVO';
}

function getRecommendation(sc, regName) {
  const supreme   = sc.supreme;
  const provinces = sc.provinces?.[regName] || [];
  const critiche  = provinces.filter(p => computeProvSit(p) === 'EMERGENZA').length;
  const degradate = provinces.filter(p => computeProvSit(p) === 'DEGRADATO').length;
  const allZeroSO115 = provinces.length > 0 && provinces.every(p => p.so115 === 0);

  if (!supreme || !supreme.codem) {
    // Anomalia: fibra satura senza SO115 e senza SUPREME
    if (allZeroSO115 && (critiche > 0 || degradate > 0)) {
      const saturate = provinces.filter(p => computeProvSit(p) !== 'OPERATIVO').length;
      return {
        level: 'ATTENZIONE',
        text:  `${saturate} Comand${saturate > 1 ? 'i' : 'o'} con Fibra satura e nessuna attività SO115 correlata — nessuna emergenza SUPREME attiva. ` +
               `Possibile malfunzionamento della rete (saturazione anormale) o attacco informatico in corso. ` +
               `Azioni consigliate: (1) verificare con CED centrale il tracciato di rete, ` +
               `(2) isolare eventuali segmenti compromessi, (3) attivare procedura Incident Response cyber.`,
      };
    }
    if (critiche > 0)
      return { level: 'URGENTE',    text: 'Comandi in EMERGENZA senza CODEM attivo su SUPREME. Valutare immediatamente apertura emergenza regionale e allertamento CMR.' };
    if (degradate > 0)
      return { level: 'ATTENZIONE', text: 'Comandi degradati senza dichiarazione di emergenza. Monitorare evoluzione e valutare allertamento preventivo CMR.' };
    return { level: 'INFO', text: 'Situazione nella norma. Nessuna azione richiesta.' };
  }

  const msIct = supreme.moduli?.['MS.ICT'];
  if (msIct?.stato === 'ALLERTATO' && msIct?.impedimenti?.length > 0)
    return { level: 'ATTENZIONE', text: `MS.ICT allertato con impedimento: «${msIct.impedimenti[0]}». Verificare disponibilità risorsa alternativa presso altro Comando provinciale.` };
  if (msIct?.stato === 'PRONTO' && critiche > 0)
    return { level: 'URGENTE', text: 'Comandi in emergenza con MS.ICT in stato di prontezza. Disporre invio immediato per ripristino comunicazioni nel Distretto Operativo.' };
  if (msIct?.stato === 'IMPEGNATO')
    return { level: 'INFO', text: "Moduli CMR in missione. Verificare avanzamento sul CODEM e aggiornare rapporto d'intervento." };

  return { level: 'INFO', text: 'CODEM attivo. Moduli CMR in stato di prontezza. Situazione monitorata.' };
}

// ── Riquadro emergenza (CODEM + CMR + raccomandazione) ────────────────────────
function EmergencyInfoBox({ regName, sc, onClose }) {
  const supreme = sc.supreme;
  const rec     = getRecommendation(sc, regName);

  return (
    <div className="emg-box">
      <div className="emg-box-header">
        <span className="emg-box-title">Supporto al Soccorso — <strong>{regName}</strong></span>
        <button className="emg-box-close" onClick={onClose}>✕</button>
      </div>

      <div className="emg-box-body">
        {/* SUPREME / CODEM */}
        <div className="emg-col">
          <div className="emg-section-title">SUPREME / CODEM</div>
          {supreme?.codem ? (
            <div className="rp-codem-card">
              <div className="rp-codem-badge active">ATTIVO</div>
              <div><strong>CODEM:</strong> {supreme.codem}</div>
              <div><strong>Evento:</strong> {supreme.evento}</div>
              <div><strong>Livello:</strong> {supreme.livello}</div>
            </div>
          ) : (
            <div className="rp-codem-card inactive">
              <div className="rp-codem-badge inactive">NON ATTIVO</div>
              <div style={{fontSize:11,color:'#aaa',marginTop:4}}>Nessuna emergenza dichiarata su SUPREME</div>
            </div>
          )}

          {/* Raccomandazione */}
          <div className="emg-section-title" style={{marginTop:12}}>Raccomandazione — Dir. Regionale</div>
          <div className={`rp-raccomandazione rp-rac-${rec.level.toLowerCase()}`}>
            <div className="rp-rac-level">{rec.level}</div>
            <div className="rp-rac-text">{rec.text}</div>
          </div>
        </div>

        {/* Moduli CMR */}
        {supreme?.moduli && (
          <div className="emg-col">
            <div className="emg-section-title">Moduli CMR</div>
            <div className="rp-moduli-grid">
              {Object.entries(supreme.moduli).map(([nome, mod]) => (
                <div key={nome} className="rp-modulo-card">
                  <div className="rp-mod-header">
                    <span className="rp-mod-name">{nome}</span>
                    <span className="rp-mod-stato" style={{
                      background: MOD_STATO_COLOR[mod.stato] + '22',
                      color:      MOD_STATO_COLOR[mod.stato],
                      border:     `1px solid ${MOD_STATO_COLOR[mod.stato]}55`,
                    }}>{MOD_STATO_LABEL[mod.stato]}</span>
                  </div>
                  <div className="rp-mod-row"><span className="rp-mod-label">Personale: </span>{mod.personale}</div>
                  <div className="rp-mod-row"><span className="rp-mod-label">Mezzi: </span>{mod.mezzi.join(', ')}</div>
                  {mod.impedimenti.length > 0 && (
                    <div className="rp-mod-impedimento">⚠ {mod.impedimenti.join('; ')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [scenario,       setScenario]       = useState('normal');
  const [selected,       setSelected]       = useState(new Set());
  const [statusFilters,  setStatusFilters]  = useState(new Set(['OPERATIVO','DEGRADATO','EMERGENZA']));
  const [regionDropOpen, setRegionDropOpen] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [hoveredRegion,  setHoveredRegion]  = useState(null);
  const [sortCol,        setSortCol]        = useState('sit');
  const [sortDir,        setSortDir]        = useState('asc');
  const [viewBox,        setViewBox]        = useState('0 0 610 793');
  const [so115Rischio,   setSo115Rischio]   = useState(SOGLIE.so115_rischio);
  const [expandedReg,    setExpandedReg]    = useState(null);
  const [centroids,      setCentroids]      = useState({});

  const regionDropRef = useRef(null);
  const statusDropRef = useRef(null);
  const pathRefs      = useRef({});

  // Chiudi dropdown su click fuori
  useEffect(() => {
    function onMouseDown(e) {
      if (regionDropRef.current && !regionDropRef.current.contains(e.target)) setRegionDropOpen(false);
      if (statusDropRef.current && !statusDropRef.current.contains(e.target)) setStatusDropOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Calcola centroidi per triangoli di allerta
  useEffect(() => {
    const c = {};
    Object.entries(pathRefs.current).forEach(([name, el]) => {
      if (el) {
        try {
          const b = el.getBBox();
          c[name] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        } catch (_) {}
      }
    });
    setCentroids(c);
  }, [scenario]);

  // Zoom mappa su selezione
  useEffect(() => {
    if (selected.size === 0) { setViewBox('0 0 610 793'); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(reg => {
      const el = pathRefs.current[reg];
      if (el) {
        const b = el.getBBox();
        minX = Math.min(minX, b.x);    minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x+b.width); maxY = Math.max(maxY, b.y+b.height);
      }
    });
    if (minX !== Infinity) {
      const pad = 35;
      setViewBox(`${minX-pad} ${minY-pad} ${maxX-minX+2*pad} ${maxY-minY+2*pad}`);
    }
  }, [selected]);

  const sc = SCENARIOS[scenario];

  // Dati arricchiti con sat + sit
  const enriched = useMemo(() => sc.data.map(r => {
    const sat = Math.round(r.banda / r.cap * 100);
    const sit = getSituation(r.tipo, sat);
    return { ...r, sat, sit };
  }), [sc.data]);

  const stMap = useMemo(() => {
    const m = {};
    enriched.forEach(r => { m[r.reg] = r.sit; });
    return m;
  }, [enriched]);

  // Colore mappa: usa il peggiore tra i comandi provinciali (quando disponibili)
  const mapStatusMap = useMemo(() => {
    const m = {};
    enriched.forEach(r => {
      const provs = sc.provinces?.[r.reg] || [];
      if (provs.length > 0) {
        let worst = 'OPERATIVO';
        provs.forEach(p => {
          const sit = computeProvSit(p);
          if (SIT_ORDER[sit] < SIT_ORDER[worst]) worst = sit;
        });
        m[r.reg] = worst;
      } else {
        m[r.reg] = r.sit;
      }
    });
    return m;
  }, [enriched, sc.provinces]);

  const hasSel          = selected.size > 0;
  const allStatusSel    = statusFilters.size === 3;

  const filtered = enriched.filter(r => {
    if (hasSel && !selected.has(r.reg)) return false;
    if (!allStatusSel && !statusFilters.has(r.sit)) return false;
    return true;
  });

  // Dati metriche adattativi: quando una regione è selezionata e ha dati
  // provinciali, usa i comandi provinciali (C.P.) invece del dato D.R.
  const metricsData = useMemo(() => {
    if (!hasSel) return filtered;
    const result = [];
    filtered.forEach(r => {
      const provs = sc.provinces?.[r.reg] || [];
      if (provs.length > 0) {
        provs.forEach(p => {
          const cap = CAP[p.tipo];
          const sat = Math.round(p.banda / cap * 100);
          const sit = computeProvSit(p);
          result.push({ reg: r.reg, nome: p.nome, tipo: p.tipo, banda: p.banda, cap, sat, sit, pktLoss: p.pktLoss, so115: p.so115, trend: r.trend });
        });
      } else {
        result.push(r);
      }
    });
    return result;
  }, [filtered, hasSel, sc.provinces]);

  // ── Ordinamento tabella ───────────────────────────────────────────────────
  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const sorted = [...filtered].sort((a, b) => {
    let vA, vB;
    switch (sortCol) {
      case 'reg':     vA = a.reg;     vB = b.reg;     break;
      case 'banda':   vA = a.banda;   vB = b.banda;   break;
      case 'sat':     vA = a.sat;     vB = b.sat;     break;
      case 'pktLoss': vA = a.pktLoss; vB = b.pktLoss; break;
      case 'so115':   vA = a.so115;   vB = b.so115;   break;
      default:        vA = SIT_ORDER[a.sit]; vB = SIT_ORDER[b.sit]; break;
    }
    if (typeof vA === 'string') return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
    return sortDir === 'asc' ? vA - vB : vB - vA;
  });

  // ── Metriche quadranti (adattive: usano C.P. se regione selezionata) ─────────

  const q1ok   = metricsData.filter(r => r.sit === 'OPERATIVO').length;
  const q1warn = metricsData.filter(r => r.sit === 'DEGRADATO').length;
  const q1crit = metricsData.filter(r => r.sit === 'EMERGENZA').length;
  const q1Label      = q1crit > 0 ? 'Critica' : q1warn > 0 ? 'Sotto stress' : 'Stabile';
  const q1LabelColor = q1crit > 0 ? COL.critStroke : q1warn > 0 ? COL.warnStroke : COL.okStroke;

  // Q2: sedi rete in emergenza OPPURE degradate con SO115 alto
  // (non correlato a SUPREME — è emergenza delle connessioni)
  const q2 = metricsData.filter(r =>
    r.sit === 'EMERGENZA' || (r.sit === 'DEGRADATO' && r.so115 > so115Rischio)
  ).length;

  // Q3: anomalie operative = degrado/emergenza rete con SO115 < soglia rischio
  // E nessuna emergenza SUPREME attiva che giustifichi il degrado
  const q3 = metricsData.filter(r => {
    const hasNetworkIssue = r.sit === 'EMERGENZA' || r.sit === 'DEGRADATO';
    const lowSO115        = r.so115 < so115Rischio;
    const coveredByEM01   = sc.supreme?.codem && (sc.supremeRegions || []).includes(r.reg);
    return hasNetworkIssue && lowSO115 && !coveredByEM01;
  }).length;
  const q3Color = q3 === 0 ? COL.okStroke : q3 <= 2 ? COL.warnStroke : COL.critStroke;

  const trendData = useMemo(() => {
    const sites = filtered.length > 0 ? filtered : enriched;
    const m = sites.length;
    return Array.from({ length: 30 }, (_, i) => ({
      name:     `-${30 - i}m`,
      latenza:  Math.round(sites.reduce((s, r) => s + r.trend[i].latenza, 0) / m),
      pktLoss:  +(sites.reduce((s, r) => s + r.trend[i].pktLoss, 0) / m).toFixed(2),
    }));
  }, [filtered, enriched]);

  const satData = [...metricsData]
    .sort((a, b) => (a.nome || a.reg).localeCompare(b.nome || b.reg))
    .map(r => ({
      name:       r.nome || r.reg,
      attuale:    r.sat,
      proiezione: Math.min(100, Math.round(r.sat * 1.15 + 2)),
    }));

  const q4Transitions = metricsData.map(r => {
    const satProj = Math.min(100, Math.round(r.sat * 1.15 + 2));
    const sitProj = getSituation(r.tipo, satProj);
    return sitProj !== r.sit ? { from: r.sit, to: sitProj } : null;
  }).filter(Boolean);

  const q4Groups = {};
  q4Transitions.forEach(({ from, to }) => {
    const k = `${from} → ${to}`;
    q4Groups[k] = (q4Groups[k] || 0) + 1;
  });

  const q4HasWorsening = q4Transitions.some(t => SIT_ORDER[t.to] < SIT_ORDER[t.from]);
  const trendIcon  = q4HasWorsening ? '🔺' : q4Transitions.length > 0 ? '🔄' : '➖';
  const trendLabel = q4HasWorsening ? 'Peggioramento previsto' : q4Transitions.length > 0 ? 'Transizione in corso' : 'Stabile';
  const trendColor = q4HasWorsening ? COL.critStroke : q4Transitions.length > 0 ? COL.warnStroke : COL.okStroke;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleRegion(reg) {
    if (!ACTIVE_REGIONS.includes(reg)) return;
    setSelected(prev => { const n = new Set(prev); n.has(reg) ? n.delete(reg) : n.add(reg); return n; });
    setExpandedReg(prev => prev === reg ? prev : reg);
  }
  function clearSelection() { setSelected(new Set()); setExpandedReg(null); }

  function toggleStatusFilter(st) {
    setStatusFilters(prev => {
      const n = new Set(prev);
      if (n.has(st)) { if (n.size > 1) n.delete(st); } else n.add(st);
      return n;
    });
  }

  function switchScenario(s) {
    setScenario(s);
    setSelected(new Set());
    setStatusFilters(new Set(['OPERATIVO','DEGRADATO','EMERGENZA']));
    setSo115Rischio(SOGLIE.so115_rischio);
    setExpandedReg(null);
  }

  // ── Mappa helpers (usa mapStatusMap per riflettere lo stato peggiore tra C.P.) ─
  function getFill(name) {
    if (EXCLUDED.includes(name) || !ACTIVE_REGIONS.includes(name)) return COL.excluded;
    if (hasSel && !selected.has(name)) return COL.faded;
    return sitFill(mapStatusMap[name] || 'OPERATIVO');
  }
  function getStroke(name) {
    if (EXCLUDED.includes(name)) return '#ddd';
    if (hasSel && selected.has(name)) return COL.vvf;
    return sitStroke(mapStatusMap[name] || 'OPERATIVO');
  }
  function getStrokeWidth(name) {
    if (hasSel && selected.has(name)) return 2.5;
    if (EXCLUDED.includes(name)) return 0.3;
    const sit = mapStatusMap[name] || 'OPERATIVO';
    return sit === 'EMERGENZA' ? 1.5 : sit === 'DEGRADATO' ? 1 : 0.5;
  }
  function getOpacity(name) {
    if (hasSel && ACTIVE_REGIONS.includes(name) && !selected.has(name)) return 0.25;
    return 1;
  }

  const showProvMarkers = sc.provs.length > 0 &&
    (!hasSel || sc.criticalRegions.some(r => selected.has(r)));

  // Triangolo EM01: SOLO per regioni con CODEM SUPREME attivo (supremeRegions)
  // NON dipende da criticalRegions (degrado rete) — solo da attivazione SUPREME
  const em01Regions = (sc.supreme?.codem && sc.supremeRegions?.length > 0)
    ? sc.supremeRegions
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="header">
        <div className="header-band">
          <div className="header-title">NETWORK OPERATIONS DASHBAORD CNVVF</div>
        </div>
        <div className="header-controls">
          <span className={`badge ${sc.badgeClass}`}>{sc.badge}</span>
          <div className="scenario-btns">
            {Object.values(SCENARIOS).map(s => (
              <button key={s.id} className={scenario===s.id?'active':''} onClick={()=>switchScenario(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <img src={logoVvf} alt="VVF" className="vvf-logo" />
        </div>
      </div>

      {/* ── Filtri + Legenda ── */}
      <div className="filter-bar">
        <div className="msel-wrap" ref={regionDropRef}>
          <span className="filter-label">Regioni:</span>
          <button className="msel-btn" onClick={() => setRegionDropOpen(o => !o)}>
            {selected.size === 0 ? 'Tutte le regioni' : `${selected.size} selezionate`}
            <span className="msel-arrow">{regionDropOpen ? '▲' : '▼'}</span>
          </button>
          {hasSel && <span className="reset" onClick={clearSelection}>✕ Reset</span>}
          {regionDropOpen && (
            <div className="msel-dropdown">
              {SORTED_REGIONS.map(r => (
                <label key={r} className="msel-option">
                  <input type="checkbox" checked={selected.has(r)} onChange={() => toggleRegion(r)} />
                  {r}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="filter-sep" />

        <div className="msel-wrap" ref={statusDropRef}>
          <span className="filter-label">Stato:</span>
          <button className="msel-btn" onClick={() => setStatusDropOpen(o => !o)}>
            {allStatusSel ? 'Tutti gli stati' : [...statusFilters].map(s =>
              s==='OPERATIVO'?'Operativo':s==='DEGRADATO'?'Degradato':'Emergenza'
            ).join(', ')}
            <span className="msel-arrow">{statusDropOpen ? '▲' : '▼'}</span>
          </button>
          {!allStatusSel && <span className="reset" onClick={()=>setStatusFilters(new Set(['OPERATIVO','DEGRADATO','EMERGENZA']))}>✕ Reset</span>}
          {statusDropOpen && (
            <div className="msel-dropdown">
              {[['OPERATIVO','Operativo',COL.okStroke],['DEGRADATO','Degradato',COL.warnStroke],['EMERGENZA','Emergenza',COL.critStroke]].map(([val,label,color]) => (
                <label key={val} className="msel-option">
                  <input type="checkbox" checked={statusFilters.has(val)} onChange={() => toggleStatusFilter(val)} />
                  <span className="msel-dot" style={{background:color}} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="filter-sep" />

        <div className="msel-wrap">
          <span className="filter-label">Soglia SO115 rischio:</span>
          <input
            type="number" min={0} max={30}
            className="so115-input"
            value={so115Rischio}
            onChange={e => setSo115Rischio(Math.max(0, Math.min(30, Number(e.target.value))))}
          />
          {so115Rischio !== SOGLIE.so115_rischio &&
            <span className="reset" onClick={() => setSo115Rischio(SOGLIE.so115_rischio)}>✕</span>}
        </div>

        <div className="filter-sep" />

        <div className="status-legend">
          <div className="sleg-item"><span className="sleg-dot" style={{background:COL.critStroke}} /><span><strong>Emergenza:</strong> LTE oppure saturazione ≥ 80%</span></div>
          <div className="sleg-item"><span className="sleg-dot" style={{background:COL.warnStroke}} /><span><strong>Degradato:</strong> DSL oppure saturazione 50–80%</span></div>
          <div className="sleg-item"><span className="sleg-dot" style={{background:COL.okStroke}} /><span><strong>Operativo:</strong> fibra attiva, saturazione &lt; 50%</span></div>
        </div>
      </div>

      {/* ── Quadranti ── */}
      <div className="quad-row">

        <div className="quad">
          <div className="quad-title">Margine Operativo Rete</div>
          <div className="quad-state-label" style={{color: q1LabelColor}}>{q1Label}</div>
          <div className="quad-bar-track">
            {q1ok   > 0 && <div className="quad-bar-seg" style={{flex:q1ok,   background:COL.okStroke}}   title={`Operativo: ${q1ok}`} />}
            {q1warn > 0 && <div className="quad-bar-seg" style={{flex:q1warn, background:COL.warnStroke}} title={`Degradato: ${q1warn}`} />}
            {q1crit > 0 && <div className="quad-bar-seg" style={{flex:q1crit, background:COL.critStroke}} title={`Emergenza: ${q1crit}`} />}
          </div>
          <div className="quad-bar-counts">
            {q1ok   > 0 && <span style={{color:COL.okStroke}}>{q1ok} op.</span>}
            {q1warn > 0 && <span style={{color:COL.warnStroke}}>{q1warn} deg.</span>}
            {q1crit > 0 && <span style={{color:COL.critStroke}}>{q1crit} em.</span>}
          </div>
        </div>

        <div className="quad">
          <div className="quad-title">Sedi a Rischio Operativo</div>
          <div className="quad-kpi" style={{color: q2>3?COL.critStroke:q2>0?COL.warnStroke:COL.okStroke}}>{q2}</div>
          <div className="quad-kpi-label">sedi a rischio operativo</div>
          <div className="quad-detail">Emergenza + Degradato con SO115 &gt; {so115Rischio}</div>
        </div>

        <div className="quad">
          <div className="quad-title">Anomalie Operative</div>
          <div className="quad-kpi" style={{color: q3Color}}>{q3}</div>
          <div className="quad-kpi-label">{q3 > 0 ? 'sedi anomale rilevate' : 'Nessuna anomalia'}</div>
          <div className="quad-detail">Degrado/emergenza con SO115 &lt; {so115Rischio}</div>
        </div>

        <div className="quad">
          <div className="quad-title">Tendenza Rete (+30 min)</div>
          <div className="quad-kpi" style={{color: trendColor, fontSize: 28}}>{trendIcon}</div>
          <div className="quad-kpi-label" style={{color: trendColor, fontWeight:700}}>{trendLabel}</div>
          {q4Transitions.length === 0
            ? <div className="quad-detail">Nessuna transizione di stato prevista</div>
            : <div className="q4-transitions">
                {Object.entries(q4Groups).map(([k, count]) => (
                  <div key={k} className="q4-transition-row">
                    <span style={{color: k.includes('EMERGENZA') ? COL.critStroke : COL.warnStroke}}>●</span>
                    <span>{count} {count === 1 ? 'sede' : 'sedi'}: {k}</span>
                  </div>
                ))}
              </div>
          }
        </div>

      </div>

      {/* ── Mappa + Tabella ── */}
      <div className="mid-row">
        <div className="map-section">
          <div className="section-title">Mappa connettività — clicca sulle regioni</div>
          <svg viewBox={viewBox} style={{width:'100%', maxHeight:420, cursor:'pointer'}}>
            {svgRegions.map(r => (
              <path
                key={r.id}
                ref={el => { if (el) pathRefs.current[r.italianName] = el; }}
                d={r.path}
                fill={getFill(r.italianName)}
                stroke={getStroke(r.italianName)}
                strokeWidth={getStrokeWidth(r.italianName)}
                opacity={getOpacity(r.italianName)}
                style={{transition:'fill 0.3s, stroke 0.3s, opacity 0.3s', cursor: ACTIVE_REGIONS.includes(r.italianName)?'pointer':'default'}}
                onClick={() => toggleRegion(r.italianName)}
                onMouseEnter={() => setHoveredRegion(r.italianName)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            ))}

            {/* Triangoli di allerta per regioni in emergenza */}
            {em01Regions.map(name => {
              const c = centroids[name];
              if (!c) return null;
              const tx = c.x, ty = c.y;
              const s = 9;
              return (
                <g key={`warn-${name}`}
                  style={{cursor:'pointer'}}
                  onClick={e => { e.stopPropagation(); setExpandedReg(name); }}>
                  <polygon
                    points={`${tx},${ty-s} ${tx-s*0.87},${ty+s*0.5} ${tx+s*0.87},${ty+s*0.5}`}
                    fill={COL.vvf} stroke="#fff" strokeWidth={1}
                  />
                  <text x={tx} y={ty+s*0.4} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="900"
                    style={{pointerEvents:'none'}}>!</text>
                </g>
              );
            })}

            {/* Marcatori provinciali */}
            {showProvMarkers && sc.provs.map(p => (
              <g key={p.name}>
                <circle cx={p.x} cy={p.y} r={12} fill={COL.critStroke} opacity={0.18} />
                <circle cx={p.x} cy={p.y} r={5}  fill={COL.critStroke} stroke="#fff" strokeWidth={1.5} />
                <text x={p.x+9} y={p.y+4} fontSize={13} fill="#222" fontWeight={700}
                  stroke="white" strokeWidth={3} paintOrder="stroke">{p.name}</text>
              </g>
            ))}
            {sc.epicenter && (
              <g>
                <line x1={sc.epicenter.x-7} y1={sc.epicenter.y-7} x2={sc.epicenter.x+7} y2={sc.epicenter.y+7} stroke={COL.critStroke} strokeWidth={3} />
                <line x1={sc.epicenter.x+7} y1={sc.epicenter.y-7} x2={sc.epicenter.x-7} y2={sc.epicenter.y+7} stroke={COL.critStroke} strokeWidth={3} />
                <text x={sc.epicenter.x+10} y={sc.epicenter.y-5} fontSize={13} fill={COL.critStroke} fontWeight={700}
                  stroke="white" strokeWidth={3} paintOrder="stroke">Niscemi</text>
              </g>
            )}
          </svg>
          {hoveredRegion && mapStatusMap[hoveredRegion] && (
            <div className="map-tooltip">
              <strong>{hoveredRegion}</strong><br/>
              <span style={{color: sitStroke(mapStatusMap[hoveredRegion])}}>{mapStatusMap[hoveredRegion]}</span>
              {stMap[hoveredRegion] === 'EMERGENZA' && <span style={{color:COL.critStroke}}> — clicca ▲ per dettagli</span>}
            </div>
          )}
          <div className="legend">
            <span><span className="legend-dot" style={{background:COL.okStroke}} />Operativo</span>
            <span><span className="legend-dot" style={{background:COL.warnStroke}} />Degradato</span>
            <span><span className="legend-dot" style={{background:COL.critStroke}} />Emergenza</span>
            <span><span className="legend-dot" style={{background:COL.excluded}} />Esclusa</span>
            {em01Regions.length > 0 &&
              <span><span className="legend-dot" style={{background:COL.vvf,borderRadius:0,clipPath:'polygon(50% 0%,0% 100%,100% 100%)'}} />Allerta</span>}
          </div>
        </div>

        <div className="table-section">
          <div className="section-title">
            Dettaglio sedi
            {expandedReg && <span className="table-expanded-hint"> — clicca riga per espandere province</span>}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    ['reg',     'Sede / Comando'],
                    ['tipo',    'Tipo'],
                    ['banda',   'Banda'],
                    ['cap',     'Cap.'],
                    ['sat',     'Saturaz.'],
                    ['pktLoss', 'Pkt Loss'],
                    ['so115',   'SO115'],
                    ['sit',     'Situazione'],
                  ].map(([col,label]) => {
                    const sortable = ['reg','banda','sat','pktLoss','so115','sit'].includes(col);
                    return (
                      <th key={col}
                        onClick={sortable ? () => toggleSort(col) : undefined}
                        style={sortable ? {cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'} : {}}>
                        {label}
                        {sortable && sortCol===col &&
                          <span style={{marginLeft:3,color:COL.vvf}}>{sortDir==='asc'?'▲':'▼'}</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const sitLabel   = r.sit === 'OPERATIVO' ? 'Operativo' : r.sit === 'DEGRADATO' ? 'Degradato' : 'Emergenza';
                  const sitClass   = r.sit === 'OPERATIVO' ? 'status-ok' : r.sit === 'DEGRADATO' ? 'status-warning' : 'status-critical';
                  const pktColor   = r.pktLoss > 5 ? COL.critStroke : r.pktLoss >= 1 ? COL.warnStroke : COL.okStroke;
                  const isExpanded = expandedReg === r.reg;
                  const provinces  = sc.provinces?.[r.reg] || [];
                  const hasProv    = provinces.length > 0;
                  const hasSupreme = !!(sc.supreme?.codem && (sc.supremeRegions || []).includes(r.reg));
                  return (
                    <React.Fragment key={r.reg}>
                      {/* ── Riga D.R. (Direzione Regionale) ── */}
                      <tr
                        onClick={() => setExpandedReg(isExpanded ? null : r.reg)}
                        style={{
                          cursor: 'pointer',
                          background: hasSupreme ? '#fff0f0' : isExpanded ? '#fff8f8' : undefined,
                          borderLeft: hasSupreme ? `3px solid ${COL.vvf}` : undefined,
                        }}
                      >
                        <td style={{fontWeight: hasSupreme ? 700 : 600, color: hasSupreme ? COL.vvf : undefined}}>
                          <span className="expand-arrow">{isExpanded ? '▼' : '▶'}</span>
                          <span style={{fontSize:10, color: hasSupreme ? '#e57373' : '#999', fontWeight:400, marginRight:3}}>D.R.</span>
                          {r.reg}
                          {hasSupreme &&
                            <span style={{marginLeft:7, fontSize:10, fontWeight:700, color:'#fff',
                              background: COL.vvf, padding:'1px 7px', borderRadius:3, letterSpacing:'0.3px'}}>
                              SUPREME
                            </span>}
                        </td>
                        <td>
                          <span style={{
                            color: sitStroke(r.sit), fontWeight: 700,
                            background: sitFill(r.sit),
                            padding: '1px 8px', borderRadius: 4, fontSize: 11
                          }}>{r.tipo}</span>
                        </td>
                        <td>{r.banda} Mbps</td>
                        <td style={{color:'#aaa'}}>{r.cap} Mbps</td>
                        <td>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{
                              width: `${Math.min(r.sat,100)}%`,
                              background: r.sat>=80?COL.critStroke:r.sat>=50?COL.warnStroke:COL.okStroke
                            }} />
                          </div>
                          <span style={{marginLeft:4}}>{r.sat}%</span>
                        </td>
                        <td style={{color: pktColor, fontWeight:500}}>{r.pktLoss}%</td>
                        <td style={{textAlign:'center', color:'#ccc', fontSize:13}}>—</td>
                        <td><span className={`status-pill ${sitClass}`}>{sitLabel}</span></td>
                      </tr>

                      {/* ── Righe C.P. (Comandi Provinciali) espanse ── */}
                      {isExpanded && hasProv && provinces.map(p => {
                        const pCap = CAP[p.tipo];
                        const pSat = Math.round(p.banda / pCap * 100);
                        const pSit = p.tipo === 'LTE' ? 'EMERGENZA' : pSat >= 80 ? 'EMERGENZA' : pSat >= 50 ? 'DEGRADATO' : 'OPERATIVO';
                        const pSitLabel = pSit === 'OPERATIVO' ? 'Operativo' : pSit === 'DEGRADATO' ? 'Degradato' : 'Emergenza';
                        const pSitClass = pSit === 'OPERATIVO' ? 'status-ok' : pSit === 'DEGRADATO' ? 'status-warning' : 'status-critical';
                        const pPktColor = p.pktLoss > 5 ? COL.critStroke : p.pktLoss >= 1 ? COL.warnStroke : COL.okStroke;
                        return (
                          <tr key={p.nome} className="prov-sub-row">
                            <td style={{paddingLeft:24, fontWeight:500}}>
                              <span style={{fontSize:10, color:'#bbb', marginRight:3}}>C.P.</span>
                              {p.nome}
                            </td>
                            <td>
                              <span style={{
                                color: sitStroke(pSit), fontWeight:700,
                                background: sitFill(pSit),
                                padding:'1px 7px', borderRadius:4, fontSize:10
                              }}>{p.tipo}</span>
                            </td>
                            <td style={{fontSize:11}}>{p.banda} Mbps</td>
                            <td style={{fontSize:11, color:'#aaa'}}>{pCap} Mbps</td>
                            <td>
                              <div className="bar-bg">
                                <div className="bar-fill" style={{
                                  width:`${Math.min(pSat,100)}%`,
                                  background: pSat>=80?COL.critStroke:pSat>=50?COL.warnStroke:COL.okStroke
                                }} />
                              </div>
                              <span style={{marginLeft:4, fontSize:11}}>{pSat}%</span>
                            </td>
                            <td style={{fontSize:11, color:pPktColor, fontWeight:500}}>{p.pktLoss}%</td>
                            <td style={{textAlign:'center', fontSize:11, fontWeight:500,
                              color:p.so115>15?COL.critStroke:p.so115>5?COL.warnStroke:'#aaa'}}>{p.so115}</td>
                            <td><span className={`status-pill ${pSitClass}`} style={{fontSize:10}}>{pSitLabel}</span></td>
                          </tr>
                        );
                      })}
                      {isExpanded && !hasProv && (
                        <tr className="prov-sub-row">
                          <td colSpan={8} style={{paddingLeft:28, fontSize:11, color:'#aaa', fontStyle:'italic'}}>
                            Dati a livello di Comando non disponibili per questo scenario.
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Riquadro emergenza (CODEM + CMR + raccomandazione) ── */}
      {expandedReg && sc.supreme && (
        <div style={{padding:'0 16px', marginBottom:12}}>
          <EmergencyInfoBox
            regName={expandedReg}
            sc={sc}
            onClose={() => setExpandedReg(null)}
          />
        </div>
      )}

      {/* ── Grafici ── */}
      <div className="bottom-row">
        <div>
          <div className="section-title">Trend latenza e packet loss (30 min)</div>
          <div className="chart-legend">
            <span><span className="chart-dot" style={{background:COL.vvf}} />Latenza (ms)</span>
            <span><span className="chart-dot" style={{background:'#1976d2'}} />Packet loss (%)</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize:11,fill:'#999'}} interval={4} />
              <YAxis yAxisId="left"  tick={{fontSize:11,fill:'#999'}} label={{value:'ms',    position:'insideLeft',  fontSize:11,fill:'#999'}} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:'#999'}} label={{value:'%loss', position:'insideRight', fontSize:11,fill:'#999'}} />
              <Tooltip />
              <Line yAxisId="left"  type="monotone" dataKey="latenza"  stroke={COL.vvf}    strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="pktLoss"  stroke="#1976d2"    strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="section-title">Saturazione banda per sede — % sul link attivo</div>
          <div className="chart-legend">
            <span><span className="chart-dot" style={{background:COL.vvf}} />Attuale (%)</span>
            <span><span className="chart-dot" style={{background:'rgba(193,39,45,0.25)'}} />Proiezione +30min</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={satData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#999'}} angle={-45} textAnchor="end" height={55} />
              <YAxis tick={{fontSize:11,fill:'#999'}} domain={[0,100]} tickFormatter={v=>`${v}%`} />
              <Tooltip formatter={v=>`${v}%`} />
              <Bar dataKey="attuale"    fill={COL.vvf}                  radius={[2,2,0,0]} />
              <Bar dataKey="proiezione" fill="rgba(193,39,45,0.22)"     radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
