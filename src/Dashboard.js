import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import regionsRaw from './italyRegions.json';
import logoVvf from './logo_vvf.png';
import './dashboard.css';

// Map English IDs to Italian names
const ID_TO_IT = {
  'abruzzo':'Abruzzo','aosta-valley':"Valle d'Aosta",'apulia':'Puglia','basilicata':'Basilicata',
  'calabria':'Calabria','campania':'Campania','emilia-romagna':'Emilia-Romagna',
  'friuli-venezia-giulia':'Friuli-Venezia Giulia','lazio':'Lazio','liguria':'Liguria',
  'lombardy':'Lombardia','marche':'Marche','molise':'Molise','piedmont':'Piemonte',
  'sardinia':'Sardegna','sicily':'Sicilia','trentino-south-tyrol':'Trentino-Alto Adige',
  'tuscany':'Toscana','umbria':'Umbria','veneto':'Veneto'
};

// 18 active regions (excluding VdA and TAA)
const ACTIVE_REGIONS = [
  'Piemonte','Liguria','Lombardia','Veneto','Friuli-Venezia Giulia','Emilia-Romagna',
  'Toscana','Umbria','Marche','Lazio','Abruzzo','Molise',
  'Campania','Puglia','Basilicata','Calabria','Sicilia','Sardegna'
];
const EXCLUDED = ["Valle d'Aosta","Trentino-Alto Adige"];

// Province markers for earthquake scenario
const PROV_MARKERS = [
  { name:'Rieti', x:340, y:370 },
  { name:'Perugia', x:305, y:330 },
  { name:'Ascoli P.', x:380, y:325 },
  { name:'Teramo', x:375, y:310 },
  { name:"L'Aquila", x:350, y:340 },
  { name:'Macerata', x:365, y:300 },
];
const EPICENTER = { x:362, y:332 };

// Colors
const COL = {
  ok: '#a5d6a7', okStroke: '#4caf50',
  warning: '#ffcc80', warnStroke: '#ff9800',
  critical: '#ef9a9a', critStroke: '#ef5350',
  excluded: '#e8e8e8', faded: '#f2f2f2',
  vvf: '#C1272D'
};

function rn(a, b) { return Math.round(a + Math.random() * (b - a)); }

function generateNormalData() {
  return ACTIVE_REGIONS.map(reg => ({
    reg, link: 'UP', banda: rn(12,35), cap: 100, latenza: rn(4,16),
    pktLoss: +(Math.random()*0.4).toFixed(1), so115: rn(0,3), status: 'ok'
  }));
}

function generateEmergencyData() {
  const crit = ['Lazio','Umbria','Marche','Abruzzo'];
  const warn = ['Toscana','Molise'];
  return ACTIVE_REGIONS.map(reg => {
    const c = crit.includes(reg), w = warn.includes(reg);
    return {
      reg, link: c?'DOWN':w?'DEGRADATO':'UP',
      banda: c?rn(90,100):w?rn(65,80):rn(12,40), cap: 100,
      latenza: c?rn(180,400):w?rn(55,90):rn(5,20),
      pktLoss: c?+(6+Math.random()*8).toFixed(1):w?+(1.5+Math.random()*3).toFixed(1):+(Math.random()*0.5).toFixed(1),
      so115: c?rn(18,35):w?rn(6,14):rn(0,4),
      status: c?'critical':w?'warning':'ok'
    };
  });
}

const latTrendNormal = Array.from({length:30},()=>rn(8,16));
const pktTrendNormal = Array.from({length:30},()=>+(Math.random()*0.4).toFixed(1));
const latTrendEmerg = [14,18,25,35,48,62,78,95,110,130,148,165,175,190,200,210,218,225,235,240,248,255,260,258,265,270,275,280,278,275];
const pktTrendEmerg = [0.3,0.5,0.8,1.2,1.8,2.5,3.2,3.8,4.5,5.0,5.5,6.0,6.2,6.5,6.8,7.0,7.2,7.5,7.3,7.6,7.8,8.0,8.2,8.0,8.3,8.5,8.7,9.0,8.8,8.7];

const SCENARIOS = {
  normal: { badge: 'Operativo', badgeClass: 'badge-ok', data: generateNormalData(), provs: [], latT: latTrendNormal, pktT: pktTrendNormal },
  emergency: { badge: 'Emergenza — Sisma Centro Italia 24/08/2016', badgeClass: 'badge-crit', data: generateEmergencyData(), provs: PROV_MARKERS, latT: latTrendEmerg, pktT: pktTrendEmerg }
};

// Build SVG regions lookup: id -> { italianName, path }
const svgRegions = regionsRaw.map(([id, engName, path]) => ({
  id, engName, italianName: ID_TO_IT[id] || engName, path
}));

function statusColor(st) { return st==='ok'?COL.ok:st==='warning'?COL.warning:st==='critical'?COL.critical:COL.excluded; }
function statusStroke(st) { return st==='ok'?COL.okStroke:st==='warning'?COL.warnStroke:st==='critical'?COL.critStroke:'#ccc'; }
function valColor(v,w,c) { return v>=c?COL.critStroke:v>=w?COL.warnStroke:COL.okStroke; }

export default function Dashboard() {
  const [scenario, setScenario] = useState('normal');
  const [selected, setSelected] = useState(new Set());
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [sortCol, setSortCol] = useState('status');
  const [sortDir, setSortDir] = useState('asc');

  const sc = SCENARIOS[scenario];
  const stMap = useMemo(() => {
    const m = {};
    sc.data.forEach(r => { m[r.reg] = r.status; });
    return m;
  }, [sc.data]);

  const hasSel = selected.size > 0;
  const filtered = hasSel ? sc.data.filter(r => selected.has(r.reg)) : sc.data;

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const STATUS_ORDER = {critical:0,warning:1,ok:2};
  const sorted = [...filtered].sort((a, b) => {
    let valA, valB;
    switch(sortCol) {
      case 'reg':    valA = a.reg; valB = b.reg; break;
      case 'banda':  valA = a.banda; valB = b.banda; break;
      case 'util':   valA = Math.round(a.banda/a.cap*100); valB = Math.round(b.banda/b.cap*100); break;
      case 'latenza':valA = a.latenza; valB = b.latenza; break;
      case 'so115':  valA = a.so115; valB = b.so115; break;
      default:       valA = STATUS_ORDER[a.status]; valB = STATUS_ORDER[b.status]; break;
    }
    if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  // KPIs
  const n = filtered.length || 1;
  const avgBanda = Math.round(filtered.reduce((s,r)=>s+r.banda,0)/n);
  const sediCrit = filtered.filter(r=>r.status!=='ok').length;
  const so115 = filtered.filter(r=>r.status!=='ok').reduce((s,r)=>s+r.so115,0);
  const avgLat = Math.round(filtered.reduce((s,r)=>s+r.latenza,0)/n);
  const critNames = filtered.filter(r=>r.status!=='ok').map(r=>r.reg).join(', ');

  // Chart data
  const trendData = sc.latT.map((lat,i) => ({ name: `-${30-i}m`, latenza: lat, pktLoss: sc.pktT[i] }));
  const satData = [...filtered].sort((a,b) => a.reg.localeCompare(b.reg)).map(r => ({ name: r.reg, attuale: r.banda, proiezione: Math.min(100, Math.round(r.banda*1.18+rn(0,5))) }));

  function toggleRegion(reg) {
    if (!ACTIVE_REGIONS.includes(reg)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(reg)) next.delete(reg); else next.add(reg);
      return next;
    });
  }

  function clearSelection() { setSelected(new Set()); }

  function switchScenario(sc) { setScenario(sc); setSelected(new Set()); }

  function getFill(italianName) {
    if (EXCLUDED.includes(italianName)) return COL.excluded;
    if (!ACTIVE_REGIONS.includes(italianName)) return COL.excluded;
    const st = stMap[italianName] || 'ok';
    if (hasSel && !selected.has(italianName)) return COL.faded;
    return statusColor(st);
  }

  function getStroke(italianName) {
    if (EXCLUDED.includes(italianName)) return '#ddd';
    if (hasSel && selected.has(italianName)) return COL.vvf;
    const st = stMap[italianName] || 'ok';
    return statusStroke(st);
  }

  function getStrokeWidth(italianName) {
    if (hasSel && selected.has(italianName)) return 2.5;
    if (EXCLUDED.includes(italianName)) return 0.3;
    const st = stMap[italianName] || 'ok';
    return st==='critical'?1.5:st==='warning'?1:0.5;
  }

  function getOpacity(italianName) {
    if (hasSel && ACTIVE_REGIONS.includes(italianName) && !selected.has(italianName)) return 0.25;
    return 1;
  }

  const showProvMarkers = scenario === 'emergency' && (!hasSel || ['Lazio','Umbria','Marche','Abruzzo'].some(r => selected.has(r)));

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-band">
          <div className="header-title">STATO CONNESSIONI CNVVF</div>
        </div>
        <div className="header-controls">
          <span className={`badge ${sc.badgeClass}`}>{sc.badge}</span>
          <div className="scenario-btns">
            <button className={scenario==='normal'?'active':''} onClick={()=>switchScenario('normal')}>Normale</button>
            <button className={scenario==='emergency'?'active':''} onClick={()=>switchScenario('emergency')}>Emergenza — Sisma 2016</button>
          </div>
          <img src={logoVvf} alt="VVF" className="vvf-logo" />
        </div>
      </div>

      {/* Region tags filter */}
      <div className="filter-bar">
        <span className="filter-label">Regioni:</span>
        <div className="tags">
          {ACTIVE_REGIONS.map(r => (
            <span key={r} className={`tag ${selected.has(r)?'active':''}`} onClick={()=>toggleRegion(r)}>{r}</span>
          ))}
        </div>
        {hasSel && <span className="reset" onClick={clearSelection}>Reset</span>}
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi"><div className="kpi-label">% Banda / capacità</div><div className="kpi-val" style={{color:valColor(avgBanda,55,80)}}>{avgBanda}%</div><div className="kpi-sub">Attenzione &gt;55% | Critica &gt;80%</div></div>
        <div className="kpi"><div className="kpi-label">Sedi degradate / emergenza</div><div className="kpi-val" style={{color:sediCrit>3?COL.critStroke:sediCrit>0?COL.warnStroke:COL.okStroke}}>{sediCrit} / {filtered.length}</div><div className="kpi-sub">{critNames||'Tutte operative'}</div></div>
        <div className="kpi"><div className="kpi-label">Interventi SO115 sedi critiche</div><div className="kpi-val" style={{color:so115>25?COL.critStroke:so115>8?COL.warnStroke:COL.okStroke}}>{so115}</div><div className="kpi-sub">Su sedi degradate o in emergenza</div></div>
        <div className="kpi"><div className="kpi-label">Latenza media</div><div className="kpi-val" style={{color:valColor(avgLat,40,120)}}>{avgLat} ms</div><div className="kpi-sub">Attenzione &gt;40ms | Critica &gt;120ms</div></div>
      </div>

      {/* Map + Table */}
      <div className="mid-row">
        <div className="map-section">
          <div className="section-title">Mappa connettività — clicca sulle regioni</div>
          <svg viewBox="0 0 610 793" style={{width:'100%',maxHeight:420,cursor:'pointer'}}>
            {svgRegions.map(r => (
              <path
                key={r.id}
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
            {/* Province markers for earthquake */}
            {showProvMarkers && sc.provs.map(p => (
              <g key={p.name}>
                <circle cx={p.x} cy={p.y} r={12} fill={COL.critStroke} opacity={0.15} />
                <circle cx={p.x} cy={p.y} r={5} fill={COL.critStroke} stroke="#fff" strokeWidth={1.5} />
                <text x={p.x+9} y={p.y+4} fontSize={13} fill="#222" fontWeight={700}
                  stroke="white" strokeWidth={3} paintOrder="stroke">{p.name}</text>
              </g>
            ))}
            {showProvMarkers && (
              <g>
                <line x1={EPICENTER.x-7} y1={EPICENTER.y-7} x2={EPICENTER.x+7} y2={EPICENTER.y+7} stroke={COL.critStroke} strokeWidth={3} />
                <line x1={EPICENTER.x+7} y1={EPICENTER.y-7} x2={EPICENTER.x-7} y2={EPICENTER.y+7} stroke={COL.critStroke} strokeWidth={3} />
                <text x={EPICENTER.x+10} y={EPICENTER.y-5} fontSize={13} fill={COL.critStroke} fontWeight={700}
                  stroke="white" strokeWidth={3} paintOrder="stroke">Epicentro</text>
              </g>
            )}
          </svg>
          {/* Tooltip */}
          {hoveredRegion && stMap[hoveredRegion] && (
            <div className="map-tooltip">
              <strong>{hoveredRegion}</strong><br/>
              Stato: {stMap[hoveredRegion]==='ok'?'Operativo':stMap[hoveredRegion]==='warning'?'Degradato':'Emergenza'}
            </div>
          )}
          <div className="legend">
            <span><span className="legend-dot" style={{background:COL.okStroke}} />Operativo</span>
            <span><span className="legend-dot" style={{background:COL.warnStroke}} />Degrado</span>
            <span><span className="legend-dot" style={{background:COL.critStroke}} />Emergenza</span>
            <span><span className="legend-dot" style={{background:COL.excluded}} />Esclusa</span>
          </div>
        </div>

        <div className="table-section">
          <div className="section-title">Dettaglio connettività WAN</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[['reg','Sede'],['link','Link MPLS'],['banda','Banda'],['cap','Cap.'],['util','% Util.'],['latenza','Latenza'],['so115','SO115'],['status','Stato']].map(([col,label]) => {
                    const sortable = ['reg','banda','util','latenza','so115','status'].includes(col);
                    return (
                      <th key={col} onClick={sortable ? ()=>toggleSort(col) : undefined}
                        style={sortable ? {cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'} : {}}>
                        {label}
                        {sortable && sortCol===col && <span style={{marginLeft:3,color:'#C1272D'}}>{sortDir==='asc'?'▲':'▼'}</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const pct = Math.round(r.banda/r.cap*100);
                  const stLabel = r.status==='ok'?'Operativo':r.status==='warning'?'Degradato':'Emergenza';
                  return (
                    <tr key={r.reg}>
                      <td style={{fontWeight:500}}>{r.reg}</td>
                      <td><span style={{color:statusStroke(r.status),fontWeight:500}}>{r.link}</span></td>
                      <td>{r.banda} Mbps</td>
                      <td>{r.cap} Mbps</td>
                      <td>
                        <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:valColor(pct,55,80)}} /></div>
                        <span style={{marginLeft:4}}>{pct}%</span>
                      </td>
                      <td style={{color:valColor(r.latenza,40,120)}}>{r.latenza} ms</td>
                      <td style={{textAlign:'center',fontWeight:500,color:r.so115>15?COL.critStroke:r.so115>5?COL.warnStroke:'#aaa'}}>{r.so115}</td>
                      <td><span className={`status-pill status-${r.status}`}>{stLabel}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts */}
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
              <YAxis yAxisId="left" tick={{fontSize:11,fill:'#999'}} label={{value:'ms',position:'insideLeft',fontSize:11,fill:'#999'}} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:'#999'}} label={{value:'%loss',position:'insideRight',fontSize:11,fill:'#999'}} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="latenza" stroke={COL.vvf} strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="pktLoss" stroke="#1976d2" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="section-title">Proiezione saturazione banda</div>
          <div className="chart-legend">
            <span><span className="chart-dot" style={{background:COL.vvf}} />Attuale</span>
            <span><span className="chart-dot" style={{background:'rgba(193,39,45,0.25)'}} />Proiezione +30min</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={satData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#999'}} angle={-45} textAnchor="end" height={55} />
              <YAxis tick={{fontSize:11,fill:'#999'}} domain={[0,100]} tickFormatter={v=>`${v}%`} />
              <Tooltip />
              <Bar dataKey="attuale" fill={COL.vvf} radius={[2,2,0,0]} />
              <Bar dataKey="proiezione" fill="rgba(193,39,45,0.2)" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
