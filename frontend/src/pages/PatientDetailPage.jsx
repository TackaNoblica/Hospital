import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const BASE = 'http://localhost:8081';
const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('careafterToken')}` });

const DOC_TYPE = {
  ANAMNEZA:          { label: 'Anamneza',         color: '#6366f1', bg: '#eef2ff' },
  FIZIKALNI:         { label: 'Fizikalni pregled', color: '#8b5cf6', bg: '#f5f3ff' },
  NALAZ_RTG:         { label: 'RTG / CT nalaz',   color: '#3b82f6', bg: '#eff6ff' },
  NALAZ_LAB:         { label: 'Lab. nalaz',        color: '#06b6d4', bg: '#ecfeff' },
  IZVESTAJ:          { label: 'Izveštaj',          color: '#f59e0b', bg: '#fffbeb' },
  KONTROLNI_PREGLED: { label: 'Kontrolni pregled', color: '#10b981', bg: '#ecfdf5' },
  OTPUSNA_LISTA:     { label: 'Otpusna lista',     color: '#ef4444', bg: '#fef2f2' },
};

const RISK_META = {
  GREEN:  { label: 'Nizak',   cls: 'green',  pill: 'pill-green'  },
  YELLOW: { label: 'Srednji', cls: 'yellow', pill: 'pill-yellow' },
  RED:    { label: 'Visok',   cls: 'red',    pill: 'pill-red'    },
};

const AVATAR_G = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#d946ef'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'], ['#f43f5e','#fb923c'],
];

const initials   = (u) => u ? `${u.firstName?.[0]??''}${u.lastName?.[0]??''}`.toUpperCase() : '?';
const avatarGrad = (id) => AVATAR_G[(id ?? 0) % AVATAR_G.length];

const fmtDate    = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDay     = (iso) => iso ? new Date(iso).getDate() : '';
const fmtMon     = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { month: 'short' }) : '';
const fmtTime    = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { hour:'2-digit', minute:'2-digit' }) : '';
const fmtLocal   = (d)   => d ? new Date(d).toLocaleDateString('sr-RS', { day:'2-digit', month:'long', year:'numeric' }) : '—';

const isUpcoming = (iso) => iso && new Date(iso) > new Date();
const isToday    = (iso) => {
  if (!iso) return false;
  const d = new Date(iso); const t = new Date();
  return d.toDateString() === t.toDateString();
};

/* SpO2 trend chart */
function SpO2Chart({ checkins }) {
  const data = [...checkins].reverse().filter((c) => c.spO2 != null);
  if (data.length < 2) return null;

  const W=580, H=120, pL=38, pR=16, pT=10, pB=24;
  const cW=W-pL-pR, cH=H-pT-pB;
  const MIN_V=84, MAX_V=100;
  const yOf = (v) => pT + (1 - (v - MIN_V) / (MAX_V - MIN_V)) * cH;

  const points = data.map((c, i) => {
    const x = pL + (i / (data.length - 1)) * cW;
    return `${x.toFixed(1)},${yOf(c.spO2).toFixed(1)}`;
  }).join(' ');

  const refLines = [
    { v: 95, color: '#10b981', label: '95%' },
    { v: 92, color: '#ef4444', label: '92%' },
  ];

  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>SpO₂ saturacija kiseonika (%)</span>
        <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 20, height: 2, background: '#10b981', borderRadius: 1 }} />
            Normala ≥95%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 20, height: 2, background: '#ef4444', borderRadius: 1 }} />
            Kritično &lt;92%
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {[84, 88, 92, 95, 98, 100].map((v) => (
          <g key={v}>
            <line x1={pL} y1={yOf(v)} x2={W-pR} y2={yOf(v)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pL-4} y={yOf(v)+4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}%</text>
          </g>
        ))}
        {refLines.map(({ v, color, label }) => (
          <line key={label} x1={pL} y1={yOf(v)} x2={W-pR} y2={yOf(v)}
            stroke={color} strokeWidth="1.2" strokeDasharray="4,3" strokeOpacity="0.7" />
        ))}
        <polyline points={points} fill="none" stroke="#06b6d4" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {data.map((c, i) => {
          const x = (pL + (i / (data.length - 1)) * cW).toFixed(1);
          const y = yOf(c.spO2).toFixed(1);
          const col = c.spO2 < 92 ? '#ef4444' : c.spO2 < 95 ? '#f59e0b' : '#06b6d4';
          return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={col} strokeWidth="2" />;
        })}
        {data.map((c, i) => {
          const x = (pL + (i / (data.length - 1)) * cW).toFixed(1);
          const label = new Date(c.createdAt).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
          return <text key={i} x={x} y={H-4} textAnchor="middle" fontSize="9" fill="#94a3b8">{label}</text>;
        })}
      </svg>
    </div>
  );
}

/* Respiratory rate trend chart */
function RespRateChart({ checkins }) {
  const data = [...checkins].reverse().filter((c) => c.respiratoryRate != null);
  if (data.length < 2) return null;

  const W=580, H=100, pL=32, pR=16, pT=8, pB=22;
  const cW=W-pL-pR, cH=H-pT-pB;
  const MIN_V=10, MAX_V=38;
  const yOf = (v) => pT + (1 - (v - MIN_V) / (MAX_V - MIN_V)) * cH;

  const points = data.map((c, i) => {
    const x = pL + (i / (data.length - 1)) * cW;
    return `${x.toFixed(1)},${yOf(c.respiratoryRate).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
        Brzina disanja (udisaja/min)
        <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>Normala: 12–20</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {[12, 16, 20, 25, 30].map((v) => (
          <g key={v}>
            <line x1={pL} y1={yOf(v)} x2={W-pR} y2={yOf(v)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pL-4} y={yOf(v)+4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
          </g>
        ))}
        <line x1={pL} y1={yOf(20)} x2={W-pR} y2={yOf(20)} stroke="#10b981" strokeWidth="1.2" strokeDasharray="4,3" strokeOpacity="0.7" />
        <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {data.map((c, i) => {
          const x = (pL + (i / (data.length - 1)) * cW).toFixed(1);
          const y = yOf(c.respiratoryRate).toFixed(1);
          const col = c.respiratoryRate > 24 ? '#ef4444' : c.respiratoryRate > 20 ? '#f59e0b' : '#8b5cf6';
          return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke={col} strokeWidth="2" />;
        })}
        {data.map((c, i) => {
          const x = (pL + (i / (data.length - 1)) * cW).toFixed(1);
          const label = new Date(c.createdAt).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
          return <text key={i} x={x} y={H-3} textAnchor="middle" fontSize="9" fill="#94a3b8">{label}</text>;
        })}
      </svg>
    </div>
  );
}

/* Medical history SVG timeline (doctor read-only view) */
function DocViewModal({ doc, onClose }) {
  const meta = DOC_TYPE[doc.documentType] || DOC_TYPE.ANAMNEZA;
  const renderContent = (text) =>
    (text || '').split('\n').map((line, i) => {
      if (/^[A-ZČĆĐŠŽ\s\/]+:$/.test(line.trim())) {
        return <div key={i} style={{ fontWeight: 700, color: '#1e1b4b', marginTop: 14, marginBottom: 4, fontSize: 13 }}>{line}</div>;
      }
      return line.trim()
        ? <div key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, paddingLeft: 4 }}>{line}</div>
        : <div key={i} style={{ height: 5 }} />;
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('sr-Latn', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 24px 4px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>{doc.title}</h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            {doc.uploadedByPatient
              ? 'Uploudovano od pacijenta'
              : `Autor: ${doc.author?.firstName} ${doc.author?.lastName}`}
          </div>
        </div>
        <div className="modal-body">
          {doc.uploadedByPatient && doc.fileName ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{doc.fileName}</div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const res = await axios.get(`${BASE}/api/medical-documents/${doc.id}/file`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` },
                    responseType: 'blob',
                  });
                  const url = URL.createObjectURL(res.data);
                  const a = document.createElement('a');
                  a.href = url; a.target = '_blank';
                  document.body.appendChild(a); a.click();
                  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
                }}
              >
                Otvori fajl pacijenta
              </button>
            </div>
          ) : (
            renderContent(doc.content || '')
          )}
        </div>
      </div>
    </div>
  );
}

function MedHistoryTimeline({ docs, onSelect }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const update = () => { if (containerRef.current) setWidth(containerRef.current.offsetWidth); };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!docs.length) return (
    <div ref={containerRef} style={{ padding: '16px 0', fontSize: 13, color: '#6b7280' }}>
      Nema medicinskih dokumenata na vremenskoj osi.
    </div>
  );

  const sorted = [...docs].sort((a, b) => new Date(a.documentDate) - new Date(b.documentDate));
  const oldest = new Date(sorted[0].documentDate);
  const newest = new Date(sorted[sorted.length - 1].documentDate);

  const start = new Date(oldest); start.setMonth(start.getMonth() - 3);
  const end   = new Date(newest); end.setMonth(end.getMonth() + 3);
  const span  = end - start;

  const PAD = 52, AXIS = 62, H = 130;
  const TW  = width - PAD * 2;
  const xOf = (d) => PAD + ((new Date(d) - start) / span) * TW;

  const yearLabels = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const ys = new Date(y, 0, 1).getTime(), ye = new Date(y + 1, 0, 1).getTime();
    const vs = Math.max(start.getTime(), ys), ve = Math.min(end.getTime(), ye);
    if (vs >= ve) continue;
    const midX = PAD + (((vs + ve) / 2) - start.getTime()) / span * TW;
    const bX   = PAD + (ys - start.getTime()) / span * TW;
    yearLabels.push({ y, midX, boundX: bX >= PAD && bX <= width - PAD ? bX : null });
  }

  const MIN_GAP = 24, L = PAD, R = PAD + TW;
  const ticks = sorted.map((doc) => ({ doc, x: xOf(doc.documentDate) }));
  for (let iter = 0; iter < 500; iter++) {
    let moved = false;
    for (let i = 0; i < ticks.length - 1; i++) {
      const gap = ticks[i + 1].x - ticks[i].x;
      if (gap < MIN_GAP) {
        const push = (MIN_GAP - gap) / 2 + 0.2;
        ticks[i].x     = Math.max(L, ticks[i].x - push);
        ticks[i + 1].x = Math.min(R, ticks[i + 1].x + push);
        moved = true;
      }
    }
    if (!moved) break;
  }

  const usedTypes = Object.keys(DOC_TYPE).filter((k) => sorted.some((d) => d.documentType === k));

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
        {yearLabels.map(({ y, boundX }) => boundX && (
          <line key={`g${y}`} x1={boundX} y1={AXIS-38} x2={boundX} y2={AXIS+6}
            stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
        ))}
        <line x1={PAD} y1={AXIS} x2={width-PAD} y2={AXIS}
          stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        {yearLabels.map(({ y, midX }) => (
          <text key={`l${y}`} x={midX} y={AXIS+18}
            textAnchor="middle" fontSize="11" fontWeight="600" fill="#94a3b8" fontFamily="Inter,sans-serif">{y}</text>
        ))}
        {ticks.map(({ doc, x }) => {
          const meta  = DOC_TYPE[doc.documentType] || DOC_TYPE.ANAMNEZA;
          const isCur = doc.relatedToCurrentIllness;
          const isUpl = doc.uploadedByPatient;
          const tickH = isCur ? 36 : 20;
          const cy    = AXIS - tickH;
          return (
            <g key={doc.id} onClick={() => onSelect(doc)} style={{ cursor: 'pointer' }}>
              <rect x={x-10} y={cy-10} width={20} height={tickH+10} fill="transparent" rx="4" />
              <line x1={x} y1={AXIS} x2={x} y2={cy}
                stroke={isUpl ? '#10b981' : meta.color} strokeWidth={isCur ? 2.5 : 1.8} strokeOpacity={isCur ? 1 : 0.65} />
              <circle cx={x} cy={cy} r={isCur ? 5.5 : 3.5}
                fill={isUpl ? '#10b981' : meta.color} fillOpacity={isCur ? 1 : 0.7} />
              {isCur && <circle cx={x} cy={cy} r={9} fill={meta.color} fillOpacity={0.12} />}
              {isUpl && <text x={x} y={cy-8} textAnchor="middle" fontSize="9" fill="#10b981">↑</text>}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingLeft: PAD, marginTop: 8 }}>
        {usedTypes.map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOC_TYPE[k].color, display: 'inline-block' }} />
            {DOC_TYPE[k].label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Upload pacijenta
        </div>
      </div>
    </div>
  );
}

/* SVG vitals chart */
function VitalsChart({ checkins }) {
  const data = [...checkins].reverse();
  const temps    = data.map((c) => c.temperature).filter((t) => t != null);
  const wellbing = data.map((c) => c.wellbeingScore).filter((v) => v != null);

  if (temps.length < 2 && wellbing.length < 2) return null;

  const W = 580, H = 150, pL = 38, pR = 16, pT = 12, pB = 28;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const tempMin = 35, tempMax = 40.5;
  const wMin = 1, wMax = 5;

  const tPoints = temps.map((v, i) => {
    const x = pL + (i / (temps.length - 1)) * cW;
    const y = pT + (1 - (v - tempMin) / (tempMax - tempMin)) * cH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const wPoints = wellbing.map((v, i) => {
    const x = pL + (i / (wellbing.length - 1)) * cW;
    const y = pT + (1 - (v - wMin) / (wMax - wMin)) * cH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gridLines = [35, 36, 37, 38, 39, 40];

  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Trend vitalnih znakova</span>
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <div style={{ width: 24, height: 3, background: '#6366f1', borderRadius: 2 }} />
            Temperatura (°C)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <div style={{ width: 24, height: 3, background: '#10b981', borderRadius: 2, borderStyle: 'dashed' }} />
            Osecanje (1-5)
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ width: '100%' }}>
        {gridLines.map((t) => {
          const y = (pT + (1 - (t - tempMin) / (tempMax - tempMin)) * cH).toFixed(1);
          return (
            <g key={t}>
              <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={pL - 5} y={+y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t}°</text>
            </g>
          );
        })}
        {temps.length >= 2 && (
          <>
            <polyline points={tPoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {temps.map((v, i) => {
              const x = (pL + (i / (temps.length - 1)) * cW).toFixed(1);
              const y = (pT + (1 - (v - tempMin) / (tempMax - tempMin)) * cH).toFixed(1);
              return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />;
            })}
          </>
        )}
        {wellbing.length >= 2 && (
          <>
            <polyline points={wPoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3" />
            {wellbing.map((v, i) => {
              const x = (pL + (i / (wellbing.length - 1)) * cW).toFixed(1);
              const y = (pT + (1 - (v - wMin) / (wMax - wMin)) * cH).toFixed(1);
              return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#10b981" strokeWidth="1.8" />;
            })}
          </>
        )}
        {data.length >= 2 && (() => {
          const step = cW / (data.length - 1);
          return data.map((c, i) => {
            const x = (pL + i * step).toFixed(1);
            const label = new Date(c.createdAt).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
            return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{label}</text>;
          });
        })()}
      </svg>
    </div>
  );
}

/* Weekly adherence trend */
function WeeklyAdherenceChart({ daily }) {
  if (!daily || daily.length < 7) return null;

  const weeks = [];
  for (let w = 0; w < 5; w++) {
    const slice = daily.slice(w * 7, w * 7 + 7);
    if (!slice.length) break;
    const tot  = slice.reduce((s, d) => s + d.total, 0);
    const tak  = slice.reduce((s, d) => s + d.taken, 0);
    const pct  = tot === 0 ? 0 : Math.round((tak / tot) * 100);
    weeks.push({ label: w === 4 ? 'Ova ned.' : `Ned. ${w + 1}`, pct });
  }
  if (weeks.length < 2) return null;

  const W = 560, H = 120, pL = 34, pR = 16, pT = 20, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;
  const xOf = (i) => pL + (i / (weeks.length - 1)) * cW;
  const yOf = (v) => pT + (1 - v / 100) * cH;

  const pts = weeks.map((w, i) => ({ x: xOf(i), y: yOf(w.pct), ...w }));
  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = `${pL},${pT + cH} ${polyline} ${pL + cW},${pT + cH}`;
  const trend = weeks[weeks.length - 1].pct - weeks[0].pct;

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
        Nedeljni trend adherencije
        <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', marginLeft: 10 }}>
          {weeks[0].pct}% → {weeks[weeks.length - 1].pct}%
          <span style={{ color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280', marginLeft: 4 }}>
            {trend > 0 ? `↑ +${trend}` : trend < 0 ? `↓ ${trend}` : '→'} pp
          </span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={pL} y1={yOf(v).toFixed(1)} x2={W - pR} y2={yOf(v).toFixed(1)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pL - 4} y={(yOf(v) + 4).toFixed(1)} textAnchor="end" fontSize="9" fill="#94a3b8">{v}%</text>
          </g>
        ))}
        <line x1={pL} y1={yOf(80).toFixed(1)} x2={W - pR} y2={yOf(80).toFixed(1)}
          stroke="#10b981" strokeWidth="1.2" strokeDasharray="4,3" strokeOpacity="0.7" />
        <text x={W - pR - 2} y={(yOf(80) - 4).toFixed(1)} textAnchor="end" fontSize="9" fill="#10b981">Cilj 80%</text>
        <polygon points={fill} fill="#6366f1" fillOpacity="0.09" />
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => {
          const col = p.pct >= 80 ? '#10b981' : p.pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <g key={i}>
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="5" fill="white" stroke={col} strokeWidth="2.2" />
              <text x={p.x.toFixed(1)} y={(p.y - 10).toFixed(1)} textAnchor="middle" fontSize="10" fontWeight="700" fill={col}>{p.pct}%</text>
              <text x={p.x.toFixed(1)} y={(H - 4).toFixed(1)} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Gaussian / KDE distribution of all patients */
function GaussianDistChart({ allAdherence, currentPatientId }) {
  if (!allAdherence || allAdherence.length < 2) return null;
  const values = allAdherence.map(p => p.adherencePct);
  const curId  = Number(currentPatientId);
  const curPct = allAdherence.find(p => p.patientId === curId)?.adherencePct;

  const n    = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sigma = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n) || 15;
  const h    = 1.06 * sigma * Math.pow(n, -0.2); // Silverman bandwidth

  const W = 560, H = 130, pL = 24, pR = 20, pT = 14, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;
  const xPos = (v) => pL + (v / 100) * cW;
  const STEPS = 120;

  const kdeY = [];
  for (let i = 0; i <= STEPS; i++) {
    const xVal = (i / STEPS) * 100;
    const d = values.reduce((acc, xi) => {
      const u = (xVal - xi) / h;
      return acc + Math.exp(-0.5 * u * u);
    }, 0) / (n * h * Math.sqrt(2 * Math.PI));
    kdeY.push(d);
  }
  const maxD = Math.max(...kdeY);
  const yOf = (d) => pT + cH - (d / (maxD * 1.15)) * cH;

  const polyline = kdeY.map((d, i) => {
    const x = pL + (i / STEPS) * cW;
    return `${x.toFixed(1)},${yOf(d).toFixed(1)}`;
  }).join(' ');
  const fill = `${pL},${pT + cH} ${polyline} ${pL + cW},${pT + cH}`;

  const rank    = curPct != null ? values.filter(v => v < curPct).length + 1 : null;
  const rankPct = curPct != null ? Math.round((rank / n) * 100) : null;

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        Distribucija komplijanse — poređenje pacijenata
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        KDE kriva {n} pacijenata.
        {curPct != null && (
          <> Ovaj pacijent (<strong style={{ color: '#6366f1' }}>{curPct}%</strong>) je u{' '}
            <strong style={{ color: '#6366f1' }}>{rankPct}. percentilu</strong> u poređenju sa ostalima.</>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={xPos(v)} y1={pT} x2={xPos(v)} y2={pT + cH} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
            <text x={xPos(v)} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">{v}%</text>
          </g>
        ))}
        <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="#cbd5e1" strokeWidth="1.5" />
        <polygon points={fill} fill="#6366f1" fillOpacity="0.12" />
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Current patient vertical */}
        {curPct != null && (
          <>
            <line x1={xPos(curPct).toFixed(1)} y1={pT} x2={xPos(curPct).toFixed(1)} y2={pT + cH}
              stroke="#6366f1" strokeWidth="2" strokeDasharray="5,3" />
            <text x={xPos(curPct)} y={pT + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#6366f1">
              ▼ {curPct}%
            </text>
          </>
        )}
        {/* Patient dots on baseline */}
        {allAdherence.map(p => {
          const isCur = p.patientId === curId;
          return (
            <circle key={p.patientId} cx={xPos(p.adherencePct).toFixed(1)} cy={pT + cH}
              r={isCur ? 5.5 : 3.5} fill={isCur ? '#6366f1' : '#94a3b8'} />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {allAdherence.map(p => {
          const isCur = p.patientId === curId;
          return (
            <div key={p.patientId} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                background: isCur ? '#6366f1' : '#94a3b8', display: 'inline-block' }} />
              <span style={{ color: isCur ? '#6366f1' : 'var(--muted)', fontWeight: isCur ? 700 : 400 }}>
                {p.patientName} ({p.adherencePct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COUGH_LBL  = { DRY: 'suh', PRODUCTIVE: 'produktivan' };
const SPUTUM_LBL = { WHITE: 'beli sekret', YELLOW_GREEN: 'žuto-zeleni sekret', BLOODY: 'hemoptiza ⚠️' };
const DYSPN_LBL  = ['U miru okej', 'Brzi hod', 'Sporiji hod/stajanje', 'Stajanje na 100m', 'Predispnoičan u sobi'];

function fmtCheckinShort(c) {
  const p = [];
  if (c.temperature != null) p.push(`temp ${c.temperature}°C`);
  if (c.spO2 != null) p.push(`SpO₂ ${c.spO2}%`);
  if (c.respiratoryRate != null) p.push(`RR ${c.respiratoryRate}/min`);
  if (c.wellbeingScore != null) p.push(`osecanje ${c.wellbeingScore}/5`);
  if (c.hasCough) p.push(`kasalj`);
  if (c.dyspneaLevel != null) p.push(`mMRC ${c.dyspneaLevel}`);
  if (c.hasWheezing) p.push(`zvizdanje`);
  if (c.hasFatigue) p.push(`umor`);
  if (c.hasNightSweats) p.push(`nocno znojenje`);
  if (c.generalWorsening) p.push(`opste pogorsanje`);
  return p.join(', ') || '—';
}

function getPatientMegiAnswer(q, patient, checkins, plans, medDocs, appts) {
  if (!patient) return 'Podaci o pacijentu nisu učitani.';
  const ql = q.toLowerCase();
  const plan  = plans[0];
  const lastC = checkins[0];
  const name  = `${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`.trim();
  const WE    = ['','😩','😞','😐','🙂','😊'];

  if (ql.includes('sumari') || ql.includes('sumira') || ql.includes('sve o') || ql.includes('opsti') || ql.includes('opšti') || ql.includes('rezime') || ql.includes('pregled pacijenta')) {
    const meds   = plan?.medications?.map(m => m.medicationName).join(', ') || 'nema';
    const alarms = checkins.filter(c => c.riskLevel === 'RED').length;
    const lastAl = checkins.find(c => c.riskLevel === 'RED');
    const upc    = appts.filter(a => new Date(a.appointmentDate) > new Date());
    let txt = `## Opšti pregled — ${name}\n\n`;
    txt += `**Dijagnoza:** ${patient.diagnosis || '—'}\n`;
    txt += `**Odsek:** ${patient.hospitalDepartment || '—'}\n`;
    txt += `**Karton:** ${patient.diagnosisStatus === 'ACTIVE' ? 'Otvoren' : 'Zatvoren'}\n\n`;
    txt += `**Prijave:** ${checkins.length} ukupno`;
    if (lastC) txt += `, poslednja ${new Date(lastC.createdAt).toLocaleDateString('sr-RS')}`;
    txt += '\n';
    if (lastC) txt += `**Trenutni rizik:** ${RISK_META[lastC.riskLevel || 'GREEN']?.label} (${lastC.riskLevel || 'GREEN'})\n`;
    txt += `**Alarma ukupno:** ${alarms}`;
    if (lastAl) txt += ` (poslednji: ${new Date(lastAl.createdAt).toLocaleDateString('sr-RS')})`;
    txt += '\n';
    txt += `**Terapija:** ${meds}\n`;
    if (upc.length > 0) txt += `**Sledeći pregled:** ${new Date(upc[0].appointmentDate).toLocaleDateString('sr-RS', { day:'2-digit', month:'long', year:'numeric' })} — ${upc[0].appointmentType}\n`;
    if (plan?.warningSigns) txt += `\n**Znaci upozorenja:** ${plan.warningSigns}`;
    return txt;
  }

  if ((ql.includes('posledn') || ql.includes('zadnj') || ql.includes('last')) &&
      (ql.includes('prijav') || ql.includes('check') || ql.includes('simptom') || ql.includes('upitnik'))) {
    if (!lastC) return `${name} još nije popunio nijedan upitnik.`;
    let txt = `**Poslednja prijava:** ${new Date(lastC.createdAt).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}\n\n`;
    txt += `**Rizik:** ${RISK_META[lastC.riskLevel || 'GREEN']?.label}\n`;
    if (lastC.temperature != null)     txt += `**Temperatura:** ${lastC.temperature}°C\n`;
    if (lastC.spO2 != null)            txt += `**SpO₂:** ${lastC.spO2}%${lastC.spO2 < 92 ? ' ⚠️ KRITIČNO' : lastC.spO2 < 95 ? ' ⚠️' : ''}\n`;
    if (lastC.respiratoryRate != null) txt += `**Resp. brzina:** ${lastC.respiratoryRate}/min${lastC.respiratoryRate > 24 ? ' ⚠️' : ''}\n`;
    if (lastC.wellbeingScore != null)  txt += `**Osecanje:** ${WE[lastC.wellbeingScore]} ${lastC.wellbeingScore}/5\n`;
    if (lastC.dyspneaLevel != null)    txt += `**Dispneja mMRC:** ${lastC.dyspneaLevel} — ${DYSPN_LBL[lastC.dyspneaLevel]}\n`;
    if (lastC.hasCough)                txt += `**Kasalj:** ${COUGH_LBL[lastC.coughType] || 'da'}${lastC.sputumColor ? ` — ${SPUTUM_LBL[lastC.sputumColor]}` : ''}${lastC.coughIntensity ? ` (${lastC.coughIntensity}/10)` : ''}\n`;
    if (lastC.hasWheezing)             txt += `**Zvizdanje:** da\n`;
    if (lastC.hasFatigue)              txt += `**Umor:** da\n`;
    if (lastC.hasNightSweats)          txt += `**Nocno znojenje:** da\n`;
    if (lastC.generalWorsening)        txt += `**Opste pogorsanje:** da ⚠️\n`;
    if (lastC.comment)                 txt += `\n**Komentar:** "${lastC.comment}"`;
    return txt;
  }

  if (ql.includes('alarm') || ql.includes('crveno') || (ql.includes('visok') && ql.includes('rizik')) || ql.includes('hitno') || ql.includes('kritič')) {
    const alarms = checkins.filter(c => c.riskLevel === 'RED');
    if (!alarms.length) return `${name} **nema** evidentiranih alarma. Sve prijave su bile zelene ili žute.`;
    let txt = `${name} ima **${alarms.length} alarm${alarms.length === 1 ? '' : 'a'}** (crveni rizik):\n\n`;
    alarms.slice(0, 5).forEach((c, i) => {
      txt += `**${i+1}. ${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric' })}**\n  ${fmtCheckinShort(c)}\n`;
      if (c.comment) txt += `  *"${c.comment}"*\n`;
    });
    if (alarms.length > 5) txt += `\n...i još ${alarms.length - 5} alarma.`;
    return txt;
  }

  if (ql.includes('spo2') || ql.includes('kiseonik') || ql.includes('saturaci') || (ql.includes(' o2') || ql === 'o2' || ql.includes('o₂'))) {
    const d = checkins.filter(c => c.spO2 != null).slice(0, 7);
    if (!d.length) return `Nema podataka o SpO₂ za ${name}.`;
    let txt = `**SpO₂ saturacija** — poslednjih ${d.length} merenja:\n\n`;
    d.forEach(c => {
      const f = c.spO2 < 92 ? ' 🔴 KRITIČNO' : c.spO2 < 95 ? ' 🟡' : ' 🟢';
      txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: **${c.spO2}%**${f}\n`;
    });
    const avg = d.reduce((s, c) => s + c.spO2, 0) / d.length;
    txt += `\n**Prosek:** ${avg.toFixed(1)}%`;
    if (avg < 92) txt += ` ⚠️ Ispod kritične granice!`;
    else if (avg < 95) txt += ` ⚠️ Ispod normalne granice.`;
    else txt += ` ✅ U normalnom opsegu.`;
    return txt;
  }

  if (ql.includes('temperatur') || ql.includes('grozni') || ql.includes('febr') || ql.includes('vrućic')) {
    const d = checkins.filter(c => c.temperature != null).slice(0, 7);
    if (!d.length) return `Nema podataka o temperaturi za ${name}.`;
    let txt = `**Temperatura** — poslednjih ${d.length} merenja:\n\n`;
    d.forEach(c => {
      const f = c.temperature > 38.5 ? ' 🔴 Groznica' : c.temperature > 37.5 ? ' 🟡 Subfebrilno' : ' 🟢';
      txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: **${c.temperature}°C**${f}\n`;
    });
    const avg = d.reduce((s, c) => s + c.temperature, 0) / d.length;
    txt += `\n**Prosek:** ${avg.toFixed(1)}°C`;
    return txt;
  }

  if (ql.includes('disanj') || ql.includes('respir') || ql.includes('rr ') || ql === 'rr' || ql.includes('tahipnej') || ql.includes('brzina disanja')) {
    const d = checkins.filter(c => c.respiratoryRate != null).slice(0, 7);
    if (!d.length) return `Nema podataka o respiratornoj brzini za ${name}.`;
    let txt = `**Respiratorna brzina** (normala: 12-20/min):\n\n`;
    d.forEach(c => {
      const f = c.respiratoryRate > 24 ? ' 🔴 Tahipneja' : c.respiratoryRate > 20 ? ' 🟡' : ' 🟢';
      txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: **${c.respiratoryRate}/min**${f}\n`;
    });
    return txt;
  }

  if (ql.includes('lek') || ql.includes('terapij') || ql.includes('medikam') || ql.includes('pije') || ql.includes('propis')) {
    if (!plan?.medications?.length) return `${name} nema propisanih lekova u planu oporavka.`;
    let txt = `**Terapija — ${name}** (${plan.medications.length} leka):\n\n`;
    plan.medications.forEach((m, i) => {
      txt += `**${i+1}. ${m.medicationName}**\n   Doza: ${m.dosage} · ${m.frequency}\n`;
      if (m.startDate && m.endDate) txt += `   ${new Date(m.startDate).toLocaleDateString('sr-RS')} — ${new Date(m.endDate).toLocaleDateString('sr-RS')}\n`;
      if (m.instructions) txt += `   *${m.instructions}*\n`;
      txt += '\n';
    });
    return txt;
  }

  if (ql.includes('plan') || ql.includes('oporavak') || ql.includes('otpusn') || ql.includes('instrukcij') || ql.includes('upustvo')) {
    if (!plan) return `${name} nema kreiran plan oporavka.`;
    let txt = `**Plan oporavka — ${name}**\n\n`;
    if (plan.diagnosisSummary)       txt += `**Dijagnoza:** ${plan.diagnosisSummary}\n\n`;
    if (plan.recoveryInstructions)   txt += `**Uputstvo:** ${plan.recoveryInstructions}\n\n`;
    if (plan.warningSigns)           txt += `**Znaci upozorenja:** ${plan.warningSigns}\n\n`;
    if (plan.dischargeDate)          txt += `**Datum otpusta:** ${new Date(plan.dischargeDate).toLocaleDateString('sr-Latn', { day:'2-digit', month:'long', year:'numeric' })}\n`;
    return txt;
  }

  if (ql.includes('pregled') || ql.includes('zakazan') || ql.includes('termin') || ql.includes('poseta') || ql.includes('kontrola')) {
    const upc  = appts.filter(a => new Date(a.appointmentDate) > new Date());
    const past = appts.filter(a => new Date(a.appointmentDate) <= new Date());
    if (!appts.length) return `${name} nema zakazanih pregleda.`;
    let txt = '';
    if (upc.length > 0) {
      txt += `**Predstojeći pregledi (${upc.length}):**\n`;
      upc.slice(0, 3).forEach(a => {
        txt += `📅 ${new Date(a.appointmentDate).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric' })} ${new Date(a.appointmentDate).toLocaleTimeString('sr-RS', { hour:'2-digit', minute:'2-digit' })} — ${a.appointmentType}`;
        if (a.location) txt += ` (${a.location})`;
        txt += '\n';
      });
    } else {
      txt += `Nema predstojecih pregleda.\n`;
    }
    if (past.length > 0) {
      const last = past[past.length - 1];
      txt += `\n**Prošlih pregleda:** ${past.length} ukupno, poslednji: ${new Date(last.appointmentDate).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric' })} — ${last.appointmentType}`;
    }
    return txt;
  }

  if (ql.includes('dijagnoz') || ql.includes('bolest') || ql.includes('patolog') || ql.includes('oboljenj')) {
    let txt = `**Dijagnoza:** ${patient.diagnosis || '—'}\n`;
    txt += `**Karton:** ${patient.diagnosisStatus === 'ACTIVE' ? 'Otvoren (aktivna bolest)' : 'Zatvoren (rešeno)'}\n`;
    txt += `**Odsek:** ${patient.hospitalDepartment || '—'}\n`;
    if (plan?.diagnosisSummary) txt += `\n**Opis iz plana:** ${plan.diagnosisSummary}`;
    return txt;
  }

  if (ql.includes('rizik') || ql.includes('risk') || ql.includes('klinički') || ql.includes('klinick') || ql.includes('kliniko')) {
    const cnt = { RED: 0, YELLOW: 0, GREEN: 0 };
    checkins.forEach(c => { cnt[c.riskLevel || 'GREEN']++; });
    let txt = `**Trenutni rizik:** ${RISK_META[lastC?.riskLevel || 'GREEN']?.label}\n\n`;
    txt += `🔴 Visok rizik: ${cnt.RED} prijava\n`;
    txt += `🟡 Srednji rizik: ${cnt.YELLOW} prijava\n`;
    txt += `🟢 Nizak rizik: ${cnt.GREEN} prijava\n`;
    return txt;
  }

  if (ql.includes('osecanj') || ql.includes('wellbeing') || ql.includes('raspolož')) {
    const d = checkins.filter(c => c.wellbeingScore != null).slice(0, 7);
    if (!d.length) return `Nema podataka o osecanju za ${name}.`;
    let txt = `**Osecanje pacijenta (1-5):**\n\n`;
    d.forEach(c => txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: ${WE[c.wellbeingScore]} **${c.wellbeingScore}/5**\n`);
    const avg = d.reduce((s, c) => s + c.wellbeingScore, 0) / d.length;
    txt += `\n**Prosek:** ${avg.toFixed(1)}/5`;
    return txt;
  }

  if (ql.includes('dokument') || ql.includes('istorij') || ql.includes('anamnez') || ql.includes('nalaz') || ql.includes('rtg') || ql.includes('laborat')) {
    if (!medDocs.length) return `${name} nema medicinskih dokumenata u sistemu.`;
    const sorted = [...medDocs].sort((a, b) => new Date(b.documentDate) - new Date(a.documentDate));
    let txt = `**Medicinski dokumenti (${medDocs.length}):**\n\n`;
    sorted.slice(0, 6).forEach(d => {
      const meta = DOC_TYPE[d.documentType] || DOC_TYPE.ANAMNEZA;
      txt += `**${meta.label}** — ${d.title}\n  ${new Date(d.documentDate).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric' })}`;
      if (d.author) txt += ` — ${d.author.firstName} ${d.author.lastName}`;
      if (d.uploadedByPatient) txt += ` — upload pacijenta`;
      if (d.relatedToCurrentIllness) txt += ` *(tekuća bolest)*`;
      txt += '\n\n';
    });
    if (medDocs.length > 6) txt += `...i još ${medDocs.length - 6} dokumenata.`;
    return txt;
  }

  if (ql.includes('kasalj') || ql.includes('iskašlj') || ql.includes('kašalj') || ql.includes('secern')) {
    const d = checkins.filter(c => c.hasCough);
    if (!d.length) return `${name} nije prijavljivao kasalj.`;
    let txt = `Kasalj prijavljen u **${d.length}** od ${checkins.length} prijava:\n\n`;
    d.slice(0, 5).forEach(c => {
      txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: ${COUGH_LBL[c.coughType] || 'da'}`;
      if (c.sputumColor) txt += ` — ${SPUTUM_LBL[c.sputumColor]}`;
      if (c.coughIntensity) txt += ` (${c.coughIntensity}/10)`;
      txt += '\n';
    });
    return txt;
  }

  if (ql.includes('dispnea') || ql.includes('dispnej') || ql.includes('zaduha') || ql.includes('mmrc') || ql.includes('kratko')) {
    const d = checkins.filter(c => c.dyspneaLevel != null);
    if (!d.length) return `Nema podataka o dispneji za ${name}.`;
    let txt = `**Dispneja (mMRC):**\n\n`;
    d.slice(0, 5).forEach(c => {
      const f = c.dyspneaLevel >= 3 ? ' 🔴' : c.dyspneaLevel >= 2 ? ' 🟡' : ' 🟢';
      txt += `${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit' })}: mMRC **${c.dyspneaLevel}** — ${DYSPN_LBL[c.dyspneaLevel]}${f}\n`;
    });
    return txt;
  }

  const nMatch = ql.match(/(\d+)\s*prijav/);
  if (nMatch || ql.includes('sumiraj prijave') || (ql.includes('posledn') && ql.match(/\d+/))) {
    const rawN = (ql.match(/\d+/)?.[0]) ? parseInt(ql.match(/\d+/)[0]) : 5;
    const n = Math.min(rawN, 10);
    const slice = checkins.slice(0, n);
    if (!slice.length) return `${name} još nije imao prijava.`;
    let txt = `**Poslednjih ${slice.length} prijava — ${name}:**\n\n`;
    slice.forEach((c, i) => {
      txt += `**${i+1}. ${new Date(c.createdAt).toLocaleDateString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric' })}** — ${RISK_META[c.riskLevel || 'GREEN']?.label} rizik\n  ${fmtCheckinShort(c)}\n`;
      if (c.comment) txt += `  *"${c.comment}"*\n`;
      txt += '\n';
    });
    return txt;
  }

  return `Mogu da pomognem sa sledećim podacima o **${name}**:\n\n` +
    `- **Sumiraj pacijenta** — opšti pregled\n` +
    `- **Poslednja prijava** — detalji zadnje prijave\n` +
    `- **Alarmi** — prijave visokog rizika\n` +
    `- **SpO₂ trend** — saturacija kiseonika\n` +
    `- **Temperatura** — trend temperature\n` +
    `- **Lekovi / terapija** — propisana terapija\n` +
    `- **Plan oporavka** — detalji plana\n` +
    `- **Pregledi** — zakazani i prošli pregledi\n` +
    `- **Dijagnoza** — dijagnoza i status kartona\n` +
    `- **Dokumenti** — medicinska istorija\n` +
    `- **Sumiraj poslednjih 5 prijava**`;
}

function PatientMegiChat({ patient, checkins, plans, medDocs, appts }) {
  const patName = patient ? `${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`.trim() : 'pacijenta';
  const [msgs, setMsgs] = useState([{
    from: 'megi',
    text: `Zdravo! Ja sam **Dr. Megi** 👩‍⚕️, vaš asistent za analizu kartona pacijenta **${patName}**.\n\nPročitala sam dostupnu dokumentaciju: ${checkins.length} prijav${checkins.length === 1 ? 'u' : 'a'}${plans.length > 0 ? `, plan oporavka sa ${plans[0]?.medications?.length || 0} lekova` : ''}, ${medDocs.length} medicinskih dokumenata i ${appts.length} pregleda.\n\nPitajte me šta god vas zanima o ovom pacijentu.`,
  }]);
  const [input,     setInput]     = useState('');
  const scrollRef = useRef(null);

  const QUICK = ['Sumiraj pacijenta', 'Poslednja prijava', 'Alarmi i upozorenja', 'Kakav je trend SpO₂?', 'Koje lekove pije?', 'Plan oporavka'];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMsgs(prev => [...prev, { from: 'user', text: q }]);
    setTimeout(() => {
      const answer = getPatientMegiAnswer(q, patient, checkins, plans, medDocs, appts);
      setMsgs(prev => [...prev, { from: 'megi', text: answer }]);
    }, 300);
  };

  const renderText = (txt) => txt.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p
    );
    return <div key={i} style={{ lineHeight: 1.65, minHeight: line.trim() ? undefined : 6 }}>{parts}</div>;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {QUICK.map(q => (
          <button key={q} className="btn btn-outline btn-sm" onClick={() => send(q)} style={{ fontSize: 12 }}>{q}</button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div ref={scrollRef} style={{ height: 420, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
              {m.from === 'megi' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>👩‍⚕️</div>
              )}
              <div style={{
                maxWidth: '75%', padding: '10px 14px', fontSize: 13.5,
                borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.from === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                color: m.from === 'user' ? 'white' : 'var(--text)',
              }}>
                {renderText(m.text)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Pitajte Dr. Megi o ovom pacijentu..."
            style={{ flex: 1, padding: '9px 14px', borderRadius: 24, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 13.5, outline: 'none', color: 'var(--text)' }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => send()} style={{ borderRadius: 24, paddingLeft: 18, paddingRight: 18 }}>Pošalji</button>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab,           setTab]        = useState('checkins');
  const [patient,       setPatient]    = useState(location.state?.patient || null);
  const [checkins,      setCheckins]   = useState([]);
  const [appts,         setAppts]      = useState([]);
  const [plans,         setPlans]      = useState([]);
  const [medDocs,       setMedDocs]    = useState([]);
  const [loading,       setLoading]    = useState(true);
  const [closingKarton, setClosingKarton] = useState(false);
  const [activeDoc,     setActiveDoc]  = useState(null);
  const [adherence,     setAdherence]  = useState(null);
  const [allAdherence,  setAllAdherence] = useState(null);
  const [showApptModal,    setShowApptModal]    = useState(false);
  const [apptForm,         setApptForm]         = useState({ appointmentType: '', appointmentDate: '', appointmentTime: '', location: '', note: '' });
  const [savingAppt,       setSavingAppt]       = useState(false);
  const [patientReports,   setPatientReports]   = useState([]);
  const [reportPatientModal, setReportPatientModal] = useState(false);
  const [reportReason,     setReportReason]     = useState('');
  const [sendingReport,    setSendingReport]    = useState(false);

  useEffect(() => {
    Promise.all([
      client.get(`/api/patients/${id}/checkins`),
      client.get(`/api/patients/${id}/appointments`),
      client.get(`/api/patients/${id}/discharge-plans`),
      axios.get(`${BASE}/api/medical-documents/patient/${id}`, { headers: authHdr() }),
    ]).then(([c, a, p, d]) => {
      setCheckins(c.data);
      setAppts(a.data.slice().sort((x, y) => new Date(x.appointmentDate) - new Date(y.appointmentDate)));
      setPlans(p.data);
      setMedDocs(d.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Load patient reports (by other doctors) once patient is known
  useEffect(() => {
    if (!patient?.user?.id) return;
    axios.get(`${BASE}/api/reports/on-patient/${patient.user.id}`, { headers: authHdr() })
      .then((r) => setPatientReports(r.data || []))
      .catch(() => {});
  }, [patient?.user?.id]);

  const submitPatientReport = async () => {
    if (!reportReason.trim() || !patient?.user?.id) return;
    setSendingReport(true);
    try {
      await axios.post(`${BASE}/api/reports`,
        { reportedUserId: String(patient.user.id), reportType: 'DOCTOR_REPORTS_PATIENT', reason: reportReason },
        { headers: authHdr() }
      );
      setReportPatientModal(false); setReportReason('');
      // Reload reports
      const r = await axios.get(`${BASE}/api/reports/on-patient/${patient.user.id}`, { headers: authHdr() });
      setPatientReports(r.data || []);
    } catch {} finally { setSendingReport(false); }
  };

  const latestRisk = checkins[0]?.riskLevel || 'GREEN';
  const risk  = RISK_META[latestRisk] || RISK_META.GREEN;
  const plan  = plans[0];
  const lastC = checkins[0];
  const g     = avatarGrad(patient?.id);

  const upcoming = appts.filter((a) => isUpcoming(a.appointmentDate) && a.status !== 'CANCELLED');
  const past     = appts.filter((a) => !isUpcoming(a.appointmentDate) || a.status === 'CANCELLED');

  const loadAppts = () =>
    client.get(`/api/patients/${id}/appointments`)
      .then((r) => setAppts(r.data.slice().sort((x, y) => new Date(x.appointmentDate) - new Date(y.appointmentDate))))
      .catch(() => {});

  const saveAppt = async () => {
    if (!apptForm.appointmentType || !apptForm.appointmentDate || !apptForm.appointmentTime) return;
    setSavingAppt(true);
    try {
      const dt = `${apptForm.appointmentDate}T${apptForm.appointmentTime}:00`;
      await client.post(`/api/patients/${id}/appointments`, {
        appointmentType: apptForm.appointmentType,
        appointmentDate: dt,
        location: apptForm.location,
        note: apptForm.note || null,
      });
      setShowApptModal(false);
      setApptForm({ appointmentType: '', appointmentDate: '', appointmentTime: '', location: '', note: '' });
      loadAppts();
    } finally { setSavingAppt(false); }
  };

  const cancelAppt = async (apptId) => {
    if (!window.confirm('Otkazati ovaj pregled?')) return;
    await client.patch(`/api/appointments/${apptId}/cancel`).catch(() => {});
    loadAppts();
  };

  const isKartonActive = patient?.diagnosisStatus === 'ACTIVE';

  const toggleKarton = async () => {
    if (!patient) return;
    const newStatus = isKartonActive ? 'RESOLVED' : 'ACTIVE';
    if (isKartonActive && !window.confirm(
      `Zatvoriti karton za ${patient.user?.firstName} ${patient.user?.lastName}?\n\nPacijentu će biti prikazan status "Nema aktivnih bolesti".`
    )) return;
    setClosingKarton(true);
    try {
      const res = await axios.patch(
        `http://localhost:8081/api/patients/${patient.id}/diagnosis-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` } }
      );
      setPatient((prev) => ({ ...prev, diagnosisStatus: res.data.diagnosisStatus }));
    } catch { /* ignore */ }
    finally { setClosingKarton(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page">
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={() => navigate('/patients')}>
              ← Moji pacijenti
            </button>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span>{patient?.user?.firstName} {patient?.user?.lastName}</span>
          </div>

          {/* Patient hero */}
          {patient && (
            <div className="patient-hero">
              <div className="avatar avatar-xl" style={{ background: `linear-gradient(135deg,${g[0]},${g[1]})`, borderRadius: 18 }}>
                {initials(patient.user)}
              </div>
              <div className="patient-hero-info">
                <div className="patient-hero-name">{patient.user?.firstName} {patient.user?.lastName}</div>
                <div className="patient-hero-badges">
                  <span className={`pill ${risk.pill}`}>{risk.label} rizik</span>
                  {plan && <span className="status-chip status-active">✓ Plan aktivan</span>}
                  <span className={`pill ${isKartonActive ? 'pill-red' : 'pill-green'}`}>
                    {isKartonActive ? '● Karton otvoren' : '● Karton zatvoren'}
                  </span>
                  {patientReports.length > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 999,
                      background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      🚩 {patientReports.length} prijava
                    </span>
                  )}
                  {lastC && (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Poslednja prijava: {fmtDate(lastC.createdAt)}
                    </span>
                  )}
                </div>
                {/* Vitals row */}
                {lastC && (
                  <div className="vitals-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 0 }}>
                    <div className="vital-item">
                      <div className="vital-icon">🌡️</div>
                      <div className="vital-val">{lastC.temperature != null ? `${lastC.temperature}°` : '—'}</div>
                      <div className="vital-label">Temperatura</div>
                    </div>
                    <div className="vital-item">
                      <div className="vital-icon" style={{ fontSize: 16 }}>O₂</div>
                      <div className="vital-val" style={{ color: lastC.spO2 != null && lastC.spO2 < 92 ? '#ef4444' : lastC.spO2 != null && lastC.spO2 < 95 ? '#f59e0b' : undefined }}>
                        {lastC.spO2 != null ? `${lastC.spO2}%` : '—'}
                      </div>
                      <div className="vital-label">SpO₂</div>
                    </div>
                    <div className="vital-item">
                      <div className="vital-icon">{['','😩','😞','😐','🙂','😊'][lastC.wellbeingScore] || '—'}</div>
                      <div className="vital-val">{lastC.wellbeingScore != null ? `${lastC.wellbeingScore}/5` : '—'}</div>
                      <div className="vital-label">Osecanje</div>
                    </div>
                    <div className="vital-item">
                      <div className="vital-icon">📋</div>
                      <div className="vital-val">{checkins.length}</div>
                      <div className="vital-label">Prijava ukupno</div>
                    </div>
                    <div className="vital-item">
                      <div className="vital-icon">📅</div>
                      <div className="vital-val">{upcoming.length}</div>
                      <div className="vital-label">Predstojeći</div>
                    </div>
                  </div>
                )}
                <div className="patient-hero-grid" style={{ marginTop: lastC ? 16 : 0 }}>
                  <div>
                    <div className="hero-stat-label">Odsek</div>
                    <div className="hero-stat-value">{patient.hospitalDepartment}</div>
                  </div>
                  <div>
                    <div className="hero-stat-label">Dijagnoza</div>
                    <div className="hero-stat-value" style={{ fontSize: 13 }}>{patient.diagnosis}</div>
                  </div>
                  <div>
                    <div className="hero-stat-label">Pol</div>
                    <div className="hero-stat-value">{patient.gender}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patient doctor-reports list */}
          {patientReports.length > 0 && (
            <div style={{
              background: '#fff8f8', border: '1.5px solid #fca5a5', borderRadius: 14,
              padding: '14px 20px', marginBottom: 12,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#dc2626', marginBottom: 10 }}>
                🚩 Ovaj pacijent je bio prijavljen ({patientReports.length}×)
              </div>
              {patientReports.map((rep) => (
                <div key={rep.id} style={{ fontSize: 13, color: '#7f1d1d', marginBottom: 6, paddingLeft: 4 }}>
                  <span style={{ fontWeight: 700 }}>Dr. {rep.reporter?.firstName} {rep.reporter?.lastName}</span>
                  {' · '}{rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('sr-RS') : ''}
                  {': '}
                  <span>{rep.reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Close / reopen karton + report patient */}
          {patient && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 8 }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setReportPatientModal(true); setReportReason(''); }}
                style={{ fontSize: 13, borderColor: '#fca5a5', color: '#ef4444' }}
              >
                🚩 Prijavi pacijenta
              </button>
              <button
                className={`btn ${isKartonActive ? 'btn-danger-outline' : 'btn-outline'}`}
                onClick={toggleKarton}
                disabled={closingKarton}
                style={{ fontSize: 13 }}
              >
                {closingKarton ? 'Ažuriranje...' : isKartonActive ? '✕ Zatvori karton' : '↺ Otvori karton'}
              </button>
            </div>
          )}

          {/* Vitals charts */}
          {!loading && checkins.length >= 2 && <VitalsChart checkins={checkins} />}
          {!loading && <SpO2Chart checkins={checkins} />}
          {!loading && <RespRateChart checkins={checkins} />}

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${tab === 'checkins'     ? 'active' : ''}`} onClick={() => setTab('checkins')}>
              Dekurzus ({checkins.length})
            </button>
            <button className={`tab ${tab === 'history'      ? 'active' : ''}`} onClick={() => setTab('history')}>
              Medicinska istorija ({medDocs.length})
            </button>
            <button className={`tab ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}>
              Pregledi ({appts.length})
            </button>
            <button className={`tab ${tab === 'plan'         ? 'active' : ''}`} onClick={() => setTab('plan')}>
              Plan oporavka
            </button>
            <button className={`tab ${tab === 'meds'         ? 'active' : ''}`} onClick={() => setTab('meds')}>
              Terapija ({plan?.medications?.length || 0})
            </button>
            <button className={`tab ${tab === 'adherence'    ? 'active' : ''}`}
              onClick={() => {
                setTab('adherence');
                if (!adherence) {
                  axios.get(`${BASE}/api/medications/adherence/${id}`, { headers: authHdr() })
                    .then((r) => setAdherence(r.data))
                    .catch(() => setAdherence({ error: true }));
                }
                if (!allAdherence) {
                  axios.get(`${BASE}/api/medications/adherence-summary`, { headers: authHdr() })
                    .then((r) => setAllAdherence(r.data))
                    .catch(() => {});
                }
              }}>
              💊 Komplijansa
            </button>
            <button className={`tab ${tab === 'megi' ? 'active' : ''}`} onClick={() => setTab('megi')}>
              👩‍⚕️ Dr. Megi
            </button>
          </div>

          {loading ? <div className="loading">Ucitavanje</div> : (
            <>
              {/* ── Check-ins / Dekurzus ── */}
              {tab === 'checkins' && (
                checkins.length === 0 ? (
                  <div className="empty"><div className="empty-icon">📋</div><h3>Nema prijava simptoma</h3><p>Pacijent jos nije popunio nijedan upitnik.</p></div>
                ) : (
                  <div className="card card-pad">
                    <div className="checkin-list">
                      {checkins.map((c, i) => {
                        const r   = c.riskLevel || 'GREEN';
                        const cls = r.toLowerCase();
                        const coughMap = { DRY: 'Suv', PRODUCTIVE: 'Produktivan' };
                        const sputumMap = { WHITE: 'Bel sekret', YELLOW_GREEN: 'Žuto-zelen sekret', BLOODY: 'Hemoptiza ⚠️' };
                        const dyspnMap = ['U miru okej', 'Brzi hod', 'Sporiji hod / stajanje', 'Stajanje na 100m', 'Predispnoičan u sobi'];
                        const sideMap = { LEFT: 'Levo', RIGHT: 'Desno', BOTH: 'Obostrano', STERNAL: 'Iza grudne kosti' };
                        return (
                          <div key={c.id} className="checkin-item">
                            <div className="checkin-dot-col">
                              <span className={`checkin-dot ${cls}`} />
                              {i < checkins.length - 1 && <span className="checkin-line" />}
                            </div>
                            <div className="checkin-content">
                              <div className="checkin-top">
                                <span className={`pill pill-${cls}`}>{RISK_META[r]?.label} rizik</span>
                                <span className="checkin-date">{fmtDate(c.createdAt)}</span>
                              </div>
                              <div className="checkin-vals">
                                {c.temperature != null && <span className="checkin-val">🌡️ {c.temperature}°C</span>}
                                {c.spO2 != null && (
                                  <span className="checkin-val" style={{ color: c.spO2 < 92 ? '#ef4444' : c.spO2 < 95 ? '#f59e0b' : undefined, fontWeight: c.spO2 < 95 ? 700 : 400 }}>
                                    O₂ {c.spO2}%
                                  </span>
                                )}
                                {c.respiratoryRate != null && <span className="checkin-val">💨 {c.respiratoryRate}/min</span>}
                                {c.wellbeingScore != null && <span className="checkin-val">{['','😩','😞','😐','🙂','😊'][c.wellbeingScore]} Osecanje: {c.wellbeingScore}/5</span>}
                                {c.hasCough && <span className="checkin-val">🤧 {coughMap[c.coughType] || 'Kasalj'}{c.sputumColor ? ` — ${sputumMap[c.sputumColor]}` : ''}{c.coughIntensity ? ` (${c.coughIntensity}/10)` : ''}</span>}
                                {c.dyspneaLevel != null && <span className="checkin-val" style={{ color: c.dyspneaLevel >= 3 ? '#ef4444' : undefined }}>🫁 mMRC {c.dyspneaLevel}: {dyspnMap[c.dyspneaLevel]}</span>}
                                {c.hasWheezing && <span className="checkin-val">〰️ Zviždanje</span>}
                                {c.hasFatigue && <span className="checkin-val">😴 Umor</span>}
                                {c.hasNightSweats && <span className="checkin-val">💦 Noćno znojenje</span>}
                                {c.generalWorsening && <span className="checkin-val">⚠️ Opšte pogoršanje</span>}
                              </div>
                              {c.comment && <div className="checkin-comment">"{c.comment}"</div>}
                              {c.imageData && (
                                <img src={c.imageData} alt="symptom" onClick={() => window.open(c.imageData, '_blank')}
                                  style={{ maxWidth: 140, maxHeight: 100, borderRadius: 8, marginTop: 6, objectFit: 'cover', border: '1.5px solid var(--border)', cursor: 'pointer' }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {/* ── Medical History Timeline ── */}
              {tab === 'history' && (
                <div>
                  <div className="card" style={{ padding: '24px 28px 18px', marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
                      Kompletna medicinska istorija pacijenta. Kliknite na markicu za detalje dokumenta. Veće markice = tekuća bolest.
                    </p>
                    <MedHistoryTimeline docs={medDocs} onSelect={setActiveDoc} />
                  </div>
                  {medDocs.length > 0 && (
                    <div className="card card-pad">
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Svi dokumenti</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...medDocs].sort((a, b) => new Date(b.documentDate) - new Date(a.documentDate)).map((d) => {
                          const m = DOC_TYPE[d.documentType] || DOC_TYPE.ANAMNEZA;
                          return (
                            <button key={d.id} onClick={() => setActiveDoc(d)}
                              style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${d.relatedToCurrentIllness ? '#c7d2fe' : '#e2e8f0'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, flexShrink: 0 }}>
                                {m.label}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                  {d.documentDate ? new Date(d.documentDate).toLocaleDateString('sr-Latn', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                                  {d.author && ` · ${d.author.firstName} ${d.author.lastName}`}
                                  {d.uploadedByPatient && ' · upload pacijenta'}
                                </div>
                              </div>
                              {d.relatedToCurrentIllness && (
                                <span style={{ alignSelf: 'center', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#eef2ff', color: '#6366f1' }}>
                                  Tekuća
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Appointments ── */}
              {tab === 'appointments' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 13, padding: '8px 16px' }}
                      onClick={() => setShowApptModal(true)}
                    >
                      + Zakaži pregled
                    </button>
                  </div>
                  {appts.filter((a) => a.status !== 'CANCELLED').length === 0 && upcoming.length === 0 ? (
                    <div className="empty"><div className="empty-icon">📅</div><h3>Nema zakazanih pregleda</h3></div>
                  ) : (
                    <>
                    {upcoming.length > 0 && (
                      <>
                        <div className="section-header"><span className="section-title">Predstojecu ({upcoming.length})</span></div>
                        <div className="appt-list" style={{ marginBottom: 24 }}>
                          {upcoming.map((a) => (
                            <div key={a.id} className={`appt-card ${isToday(a.appointmentDate) ? 'urgent' : 'upcoming'}`}>
                              <div className="appt-date-block">
                                <div className="appt-day">{fmtDay(a.appointmentDate)}</div>
                                <div className="appt-month">{fmtMon(a.appointmentDate)}</div>
                              </div>
                              <div className="appt-body">
                                <div className="appt-title">{a.appointmentType}</div>
                                <div className="appt-meta">
                                  <span>🕐 {fmtTime(a.appointmentDate)}</span>
                                  <span>📍 {a.location}</span>
                                </div>
                                {a.note && <p className="appt-note">{a.note}</p>}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                                {isToday(a.appointmentDate) && (
                                  <span className="appt-badge" style={{ background: 'var(--red-bg)', color: 'var(--red-dark)' }}>Danas!</span>
                                )}
                                <button onClick={() => cancelAppt(a.id)}
                                  style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                                  Otkaži
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {past.length > 0 && (
                      <>
                        <div className="section-header"><span className="section-title" style={{ color: 'var(--muted)' }}>Prosli ({past.length})</span></div>
                        <div className="appt-list">
                          {past.slice().reverse().map((a) => (
                            <div key={a.id} className={`appt-card ${a.status === 'CANCELLED' ? '' : 'past'}`} style={a.status === 'CANCELLED' ? { opacity: 0.6 } : undefined}>
                              <div className="appt-date-block">
                                <div className="appt-day">{fmtDay(a.appointmentDate)}</div>
                                <div className="appt-month">{fmtMon(a.appointmentDate)}</div>
                              </div>
                              <div className="appt-body">
                                <div className="appt-title">{a.appointmentType}
                                  {a.status === 'CANCELLED' && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '1px 7px', borderRadius: 6, border: '1px solid #fecaca' }}>Otkazano</span>}
                                </div>
                                <div className="appt-meta">
                                  <span>🕐 {fmtTime(a.appointmentDate)}</span>
                                  <span>📍 {a.location}</span>
                                </div>
                                {a.note && <p className="appt-note">{a.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    </>
                  )}
                </>
              )}

              {/* ── Plan ── */}
              {tab === 'plan' && (
                !plan ? (
                  <div className="empty"><div className="empty-icon">📄</div><h3>Nema plana oporavka</h3><p>Lekar jos nije kreirao plan za ovog pacijenta.</p></div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                      <span className="status-chip status-active">✓ Aktivan plan</span>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Datum otpusta: <strong style={{ color: 'var(--text)' }}>{fmtLocal(plan.dischargeDate)}</strong>
                      </span>
                    </div>
                    <div className="two-col">
                      <div>
                        <div className="info-block">
                          <div className="info-block-label">📋 Dijagnoza</div>
                          <div className="info-block-text">{plan.diagnosisSummary}</div>
                        </div>
                        <div className="info-block">
                          <div className="info-block-label">✅ Uputstvo za oporavak</div>
                          <div className="info-block-text">{plan.recoveryInstructions}</div>
                        </div>
                      </div>
                      <div>
                        <div className="warning-block">
                          <div className="info-block-label">⚠️ Znaci upozorenja</div>
                          <div className="info-block-text">{plan.warningSigns}</div>
                        </div>
                        <div className="info-block">
                          <div className="info-block-label">💊 Lekovi ({plan.medications?.length || 0})</div>
                          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                            {plan.medications?.map((m) => m.medicationName).join(', ') || 'Nema'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}

              {/* ── Medications ── */}
              {tab === 'meds' && (
                !plan?.medications?.length ? (
                  <div className="empty"><div className="empty-icon">💊</div><h3>Nema lekova u planu</h3></div>
                ) : (
                  <div className="med-grid">
                    {plan.medications.map((m) => (
                      <div key={m.id} className="med-card">
                        <div className="med-header">
                          <div className="med-icon">💊</div>
                          <div>
                            <div className="med-name">{m.medicationName}</div>
                            <div className="med-dosage">{m.dosage}</div>
                          </div>
                        </div>
                        <div className="med-row">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 6v4l3 3"/><circle cx="10" cy="10" r="8"/></svg>
                          {m.frequency}
                        </div>
                        <div className="med-row">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M3 9h14M8 4V2M12 4V2"/></svg>
                          {fmtLocal(m.startDate)} — {fmtLocal(m.endDate)}
                        </div>
                        {m.instructions && (
                          <div className="med-instructions">{m.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── Adherence ── */}
              {tab === 'adherence' && (
                !adherence ? (
                  <div className="loading">Ucitavanje podataka o adherenci...</div>
                ) : adherence.error ? (
                  <div className="empty"><div className="empty-icon">⚠️</div><h3>Greška pri učitavanju</h3></div>
                ) : adherence.totalMeds === 0 ? (
                  <div className="empty"><div className="empty-icon">💊</div><h3>Nema lekova u planu</h3><p>Pacijent nema propisane lekove.</p></div>
                ) : (
                  <div>
                    {/* Trend + Gaussian charts */}
                    <WeeklyAdherenceChart daily={adherence.daily} />
                    <GaussianDistChart allAdherence={allAdherence} currentPatientId={id} />

                    {/* Summary cards */}
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                      <div className="stat-card white">
                        <div className="stat-icon">💊</div>
                        <div className="stat-num" style={{ color: 'var(--text)' }}>{adherence.totalMeds}</div>
                        <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Lekova propisano</div>
                      </div>
                      <div className="stat-card white">
                        <div className="stat-icon">{adherence.adherencePct >= 80 ? '✅' : adherence.adherencePct >= 50 ? '⚠️' : '🔴'}</div>
                        <div className="stat-num" style={{ color: adherence.adherencePct >= 80 ? '#10b981' : adherence.adherencePct >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {adherence.adherencePct}%
                        </div>
                        <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Komplijansa (30 dana)</div>
                      </div>
                      <div className="stat-card white">
                        <div className="stat-icon">📅</div>
                        <div className="stat-num" style={{ color: 'var(--text)' }}>
                          {adherence.daily?.filter((d) => d.taken > 0).length || 0}
                        </div>
                        <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Dana s uzimanjem</div>
                      </div>
                    </div>

                    {/* 30-day calendar */}
                    <div className="card card-pad" style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Dnevni pregled — poslednjih 30 dana</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(adherence.daily || []).map((d) => {
                          const pct = d.total === 0 ? 0 : Math.round((d.taken / d.total) * 100);
                          const bg  = pct === 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#e2e8f0';
                          const dt  = new Date(d.date);
                          const lbl = dt.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
                          return (
                            <div key={d.date} title={`${lbl}: ${d.taken}/${d.total} uzeto`} style={{
                              width: 28, height: 28, borderRadius: 6, background: bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 700, color: pct > 0 ? 'white' : '#94a3b8',
                              cursor: 'default',
                            }}>
                              {dt.getDate()}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                        {[['#10b981','Sve uzeto'], ['#f59e0b','Delimično'], ['#e2e8f0','Nije uzeto']].map(([c, l]) => (
                          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adherence trend note */}
                    <div className="card card-pad" style={{ background: adherence.adherencePct >= 80 ? '#ecfdf5' : adherence.adherencePct >= 50 ? '#fffbeb' : '#fef2f2', border: `1px solid ${adherence.adherencePct >= 80 ? '#a7f3d0' : adherence.adherencePct >= 50 ? '#fde68a' : '#fecaca'}` }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: adherence.adherencePct >= 80 ? '#065f46' : adherence.adherencePct >= 50 ? '#92400e' : '#991b1b' }}>
                        {adherence.adherencePct >= 80 ? '✅ Dobra adherenca' : adherence.adherencePct >= 50 ? '⚠️ Umerena adherenca' : '🔴 Slaba adherenca'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        {adherence.adherencePct >= 80
                          ? 'Pacijent redovno uzima terapiju. Nastavite praćenje.'
                          : adherence.adherencePct >= 50
                            ? 'Pacijent ponekad preskače lekove. Razgovorite o važnosti redovnog uzimanja.'
                            : 'Pacijent retko uzima terapiju. Urgentno razgovorite o adherenci na sledećem pregledu.'}
                      </div>
                    </div>
                  </div>
                )
              )}
              {/* ── Dr. Megi ── */}
              {tab === 'megi' && (
                <PatientMegiChat
                  patient={patient}
                  checkins={checkins}
                  plans={plans}
                  medDocs={medDocs}
                  appts={appts}
                />
              )}
            </>
          )}
        </div>
      </div>
      {activeDoc && <DocViewModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}

      {/* ── Schedule appointment modal ── */}
      {showApptModal && (
        <div className="modal-overlay" onClick={() => setShowApptModal(false)}>
          <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: 15 }}>📅 Zakaži pregled</span>
              <button className="modal-close" onClick={() => setShowApptModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Vrsta pregleda *</label>
                <input value={apptForm.appointmentType} onChange={(e) => setApptForm((f) => ({ ...f, appointmentType: e.target.value }))}
                  placeholder="npr. Kontrolni pulmoloski pregled"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Datum *</label>
                  <input type="date" value={apptForm.appointmentDate} onChange={(e) => setApptForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Vreme *</label>
                  <input type="time" value={apptForm.appointmentTime} onChange={(e) => setApptForm((f) => ({ ...f, appointmentTime: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Lokacija</label>
                <input value={apptForm.location} onChange={(e) => setApptForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="npr. Ambulanta 3, II sprat"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Napomena (opciono)</label>
                <textarea value={apptForm.note} onChange={(e) => setApptForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Posebne napomene za pacijenta..."
                  rows={2}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
              </div>
              <button
                className="btn btn-primary"
                onClick={saveAppt}
                disabled={savingAppt || !apptForm.appointmentType || !apptForm.appointmentDate || !apptForm.appointmentTime}
                style={{ padding: '11px 0', fontSize: 14, marginTop: 4 }}
              >
                {savingAppt ? 'Zakazivanje...' : 'Zakaži pregled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report patient modal ── */}
      {reportPatientModal && (
        <div className="modal-overlay" onClick={() => setReportPatientModal(false)}>
          <div className="modal-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: 15, color: '#ef4444' }}>🚩 Prijava pacijenta</span>
              <button className="modal-close" onClick={() => setReportPatientModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '16px 24px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Ova prijava će biti vidljiva svim lekarima koji budu pratili ovog pacijenta u budućnosti.
              </p>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Razlog prijave:</label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Opišite problem — neprimereno ponašanje, ometanje lečenja..."
                rows={4}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13.5, resize: 'vertical', marginBottom: 20 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReportPatientModal(false)}>Otkaži</button>
                <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                  disabled={!reportReason.trim() || sendingReport}
                  onClick={submitPatientReport}>
                  {sendingReport ? 'Slanje...' : 'Pošalji prijavu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
