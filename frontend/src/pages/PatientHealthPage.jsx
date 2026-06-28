import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const BASE = 'http://localhost:8081';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('careafterToken')}` });
const api = (path) => axios.get(`${BASE}${path}`, { headers: authHeader() });

const DOC_TYPE = {
  ANAMNEZA:          { label: 'Anamneza',         color: '#6366f1', bg: '#eef2ff' },
  FIZIKALNI:         { label: 'Fizikalni pregled', color: '#8b5cf6', bg: '#f5f3ff' },
  NALAZ_RTG:         { label: 'RTG / CT nalaz',   color: '#3b82f6', bg: '#eff6ff' },
  NALAZ_LAB:         { label: 'Lab. nalaz',        color: '#06b6d4', bg: '#ecfeff' },
  IZVESTAJ:          { label: 'Izveštaj',          color: '#f59e0b', bg: '#fffbeb' },
  KONTROLNI_PREGLED: { label: 'Kontrolni pregled', color: '#10b981', bg: '#ecfdf5' },
  OTPUSNA_LISTA:     { label: 'Otpusna lista',     color: '#ef4444', bg: '#fef2f2' },
};

function age(dob) {
  if (!dob) return '';
  const d = new Date(dob), now = new Date();
  return now.getFullYear() - d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

function fmtDate(iso) {
  if (!iso) return 'Nepoznato';
  return new Date(iso).toLocaleDateString('sr-Latn', { day: '2-digit', month: 'long', year: 'numeric' });
}

function since(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'danas';
  if (diff === 1) return 'juče';
  if (diff < 30)  return `pre ${diff} dana`;
  if (diff < 365) return `pre ${Math.floor(diff / 30)} mes.`;
  const y = Math.floor(diff / 365);
  return `pre ${y} ${y === 1 ? 'godinu' : y < 5 ? 'godine' : 'godina'}`;
}

// ─── SVG Timeline ─────────────────────────────────────────────────────────────

function MedicalTimeline({ docs, onSelect }) {
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
    <div ref={containerRef} className="empty" style={{ padding: '24px 0', fontSize: 13 }}>
      Nema uploudovanih dokumenata na vremenskoj osi.
    </div>
  );

  const sorted = [...docs].sort((a, b) => new Date(a.documentDate) - new Date(b.documentDate));
  const oldest = new Date(sorted[0].documentDate);
  const newest = new Date(sorted[sorted.length - 1].documentDate);

  // Pad 4 months each side
  const start = new Date(oldest); start.setMonth(start.getMonth() - 4);
  const end   = new Date(newest); end.setMonth(end.getMonth() + 4);
  const span  = end - start;

  const PAD  = 52;
  const TW   = width - PAD * 2;
  const AXIS = 68;
  const H    = 140;

  const xOf = (d) => PAD + ((new Date(d) - start) / span) * TW;

  // ── Year labels: midpoint of each calendar year within [start,end] ──────────
  const yearLabels = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const ys = new Date(y, 0, 1).getTime();
    const ye = new Date(y + 1, 0, 1).getTime();
    const visStart = Math.max(start.getTime(), ys);
    const visEnd   = Math.min(end.getTime(), ye);
    if (visStart >= visEnd) continue;
    const midX = PAD + ((((visStart + visEnd) / 2) - start.getTime()) / span) * TW;
    // Jan 1 boundary line (if within range)
    const boundX = PAD + ((ys - start.getTime()) / span) * TW;
    yearLabels.push({ y, midX, boundX: boundX >= PAD && boundX <= width - PAD ? boundX : null });
  }

  // ── Force-spread: push adjacent ticks apart until minimum gap ───────────────
  const MIN_GAP = 24;
  const L = PAD, R = PAD + TW;
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
      <svg viewBox={`0 0 ${width} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>

        {/* Year grid lines */}
        {yearLabels.map(({ y, boundX }) => boundX && (
          <line key={`g${y}`} x1={boundX} y1={AXIS - 42} x2={boundX} y2={AXIS + 6}
            stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
        ))}

        {/* Axis */}
        <line x1={PAD} y1={AXIS} x2={width - PAD} y2={AXIS}
          stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Year labels */}
        {yearLabels.map(({ y, midX }) => (
          <text key={`l${y}`} x={midX} y={AXIS + 20}
            textAnchor="middle" fontSize="12" fontWeight="600"
            fill="#94a3b8" fontFamily="Inter,sans-serif">
            {y}
          </text>
        ))}

        {/* Document ticks */}
        {ticks.map(({ doc, x }) => {
          const meta  = DOC_TYPE[doc.documentType] || DOC_TYPE.ANAMNEZA;
          const isCur = doc.relatedToCurrentIllness;
          const isUpl = doc.uploadedByPatient;
          const tickH = isCur ? 38 : 22;
          const cy    = AXIS - tickH;
          return (
            <g key={doc.id} onClick={() => onSelect(doc)} style={{ cursor: 'pointer' }}>
              <rect x={x - 10} y={cy - 10} width={20} height={tickH + 10} fill="transparent" rx="4" />
              <line x1={x} y1={AXIS} x2={x} y2={cy}
                stroke={isUpl ? '#10b981' : meta.color}
                strokeWidth={isCur ? 2.5 : 1.8}
                strokeOpacity={isCur ? 1 : 0.6} />
              <circle cx={x} cy={cy} r={isCur ? 5.5 : isUpl ? 4 : 3.5}
                fill={isUpl ? '#10b981' : meta.color}
                fillOpacity={isCur ? 1 : 0.65} />
              {isCur && (
                <circle cx={x} cy={cy} r={9} fill={meta.color} fillOpacity={0.12} />
              )}
              {isUpl && (
                <text x={x} y={cy - 8} textAnchor="middle" fontSize="9" fill="#10b981">↑</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingLeft: PAD, marginTop: 8 }}>
        {usedTypes.map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: DOC_TYPE[k].color, display: 'inline-block' }} />
            {DOC_TYPE[k].label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid #6366f1', display: 'inline-block' }} />
          Tekuća bolest
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Vaš upload
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded }) {
  const [file,     setFile]     = useState(null);
  const [title,    setTitle]    = useState('');
  const [dateVal,  setDateVal]  = useState(new Date().toISOString().slice(0, 10));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Izaberite fajl.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title || file.name);
      fd.append('documentDate', dateVal);
      await axios.post(`${BASE}/api/medical-documents/upload`, fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
      });
      onUploaded();
      onClose();
    } catch {
      setError('Greška pri uploudovanju. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 16 }}>Dodaj nalaz</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {/* File picker */}
          <div
            className="upload-drop-zone"
            onClick={() => inputRef.current?.click()}
            style={{ borderColor: file ? '#6366f1' : undefined }}
          >
            <input ref={inputRef} type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => { setFile(e.target.files[0]); setError(''); }} />
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📄</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{(file.size / 1024).toFixed(0)} KB</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>⬆</div>
                <div style={{ fontWeight: 600 }}>Kliknite da izaberete fajl</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>PDF, JPG, PNG, DOC — maks. 10 MB</div>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Naziv nalaza (opcionalno)</label>
            <input className="form-input" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file ? file.name : 'npr. Kompletna krvna slika'} />
          </div>

          {/* Date */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Datum nalaza</label>
            <input className="form-input" type="date" value={dateVal}
              onChange={(e) => setDateVal(e.target.value)} required />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Otkaži</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !file}>
              {loading ? 'Uplouduje se...' : 'Dodaj na vremensku osu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Document Viewer Modal ─────────────────────────────────────────────────────

function DocModal({ doc, onClose }) {
  const meta = DOC_TYPE[doc.documentType] || DOC_TYPE.ANAMNEZA;

  const renderContent = (text) =>
    (text || '').split('\n').map((line, i) => {
      if (/^[A-ZČĆĐŠŽ\s\/]+:$/.test(line.trim()) || line.startsWith('##')) {
        return <div key={i} style={{ fontWeight: 700, color: '#1e1b4b', marginTop: 14, marginBottom: 4, fontSize: 13, letterSpacing: '.04em' }}>{line.replace(/^#+\s*/, '')}</div>;
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
            <span style={{ fontSize: 13, color: '#6b7280' }}>{fmtDate(doc.documentDate)}</span>
            {doc.uploadedByPatient && (
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>
                Vaš upload
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 24px 4px' }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>{doc.title}</h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            {doc.uploadedByPatient
              ? 'Uploudovano od pacijenta'
              : `Autor: ${doc.author?.firstName} ${doc.author?.lastName}`}
            {doc.relatedToCurrentIllness && (
              <span style={{ marginLeft: 10, padding: '2px 8px', background: '#eef2ff', color: '#6366f1', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                Tekuća bolest
              </span>
            )}
          </div>
        </div>
        <div className="modal-body">
          {doc.fileData !== undefined && doc.fileName ? (
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
                Otvori / Preuzmi fajl
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

// ─── Doctor Profile Panel ──────────────────────────────────────────────────────

function DoctorPanel({ req, allDocs, onClose }) {
  const [activeDoc, setActiveDoc] = useState(null);
  const doc    = req.doctor;
  const myDocs = allDocs.filter((d) => d.author?.id === doc?.id);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 700, fontSize: 16 }}>Profil lekara</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <div className="doctor-panel-avatar">
                {doc?.firstName?.[0]}{doc?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>
                  {doc?.firstName} {doc?.lastName}
                </div>
                <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>
                  Internista — Specijalista pulmologije
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  Klinika za pulmologiju, KBC
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#374151' }}>
              Dokumenti ovog lekara ({myDocs.length})
            </div>
            {myDocs.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>Nema dokumenata.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {myDocs.map((d) => {
                  const m = DOC_TYPE[d.documentType] || DOC_TYPE.ANAMNEZA;
                  return (
                    <button key={d.id} onClick={() => setActiveDoc(d)}
                      style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color, flexShrink: 0, alignSelf: 'flex-start' }}>
                        {m.label}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{fmtDate(d.documentDate)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {activeDoc && <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PatientHealthPage() {
  const [patient,    setPatient]    = useState(null);
  const [doctors,    setDoctors]    = useState([]);
  const [plans,      setPlans]      = useState([]);
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeDoc,  setActiveDoc]  = useState(null);
  const [activeReq,  setActiveReq]  = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pt, dr, pl, dc] = await Promise.all([
        api('/api/patients/me'),
        api('/api/doctor-requests/my-doctors'),
        api('/api/patients/me/discharge-plans'),
        api('/api/medical-documents/my'),
      ]);
      setPatient(pt.data);
      setDoctors(dr.data);
      setPlans(pl.data);
      setDocs(dc.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activePlan  = plans.find((p) => p.status === 'ACTIVE') || plans[0];
  const meds        = activePlan?.medications || [];
  const isActive    = patient?.diagnosisStatus === 'ACTIVE';
  const diagnosedAt = patient?.diagnosedAt;

  const currentDocs  = docs.filter((d) => d.relatedToCurrentIllness);
  const allTimeline  = [...docs].sort((a, b) => new Date(a.documentDate) - new Date(b.documentDate));

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="page-content"><div className="loading">Ucitavanje kartona...</div></main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="page-content">

        {/* ── 1. Health Status Hero ─────────────────────────────── */}
        <div className="health-hero">
          <div className="health-hero-left">
            <div className="health-hero-avatar">
              {patient?.user?.firstName?.[0]}{patient?.user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="health-hero-name">
                {patient?.user?.firstName} {patient?.user?.lastName}
              </h1>
              <div className="health-hero-meta">
                {age(patient?.dateOfBirth)} god.
                {patient?.gender === 'Female' ? ' · Ženski' : ' · Muški'}
                {patient?.hospitalDepartment ? ` · ${patient.hospitalDepartment}` : ''}
              </div>
            </div>
          </div>
          <div className={`health-status-badge ${isActive ? 'active' : 'resolved'}`}>
            <span className="health-status-dot" />
            {isActive ? 'Aktivna bolest' : 'Nema aktivnih bolesti'}
          </div>
        </div>

        {/* ── 2. Diagnosis Card ─────────────────────────────────── */}
        <div className="card health-diag-card">
          <div className="health-diag-header">
            <div>
              <div className="health-diag-label">
                {isActive ? 'Tekuća dijagnoza' : 'Poslednja dijagnoza'}
              </div>
              <div className="health-diag-text">
                {isActive
                  ? (patient?.diagnosis || 'Nema unesene dijagnoze')
                  : 'Nema aktivnih bolesti — karton je zatvoren'}
              </div>
            </div>
            {diagnosedAt && isActive && (
              <div className="health-diag-since">
                <div className="health-diag-since-label">Dijagnostikovano</div>
                <div className="health-diag-since-date">{fmtDate(diagnosedAt)}</div>
                <div className="health-diag-since-rel">{since(diagnosedAt)}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. My Doctors ─────────────────────────────────────── */}
        {doctors.length > 0 && (
          <section>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="section-title">Moji lekari</span>
              <span className="section-count">{doctors.length}</span>
            </div>
            <div className="health-doctors-row">
              {doctors.map((req) => (
                <button key={req.id} className="health-doctor-card" onClick={() => setActiveReq(req)}>
                  <div className="health-doctor-avatar">
                    {req.doctor?.firstName?.[0]}{req.doctor?.lastName?.[0]}
                  </div>
                  <div className="health-doctor-name">
                    {req.doctor?.firstName} {req.doctor?.lastName}
                  </div>
                  <div className="health-doctor-spec">Internista — Pulmolog</div>
                  <div className="health-doctor-docs">
                    {docs.filter((d) => d.author?.id === req.doctor?.id).length} dokument(a)
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Current Therapy ────────────────────────────────── */}
        {meds.length > 0 && (
          <section>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="section-title">Trenutna terapija</span>
              {activePlan?.doctor && (
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  propisao {activePlan.doctor.firstName} {activePlan.doctor.lastName}
                </span>
              )}
            </div>
            <div className="health-meds-grid">
              {meds.map((m, i) => (
                <div key={i} className="health-med-card">
                  <div className="health-med-name">{m.medicationName}</div>
                  <div className="health-med-dose">{m.dosage} · {m.frequency}</div>
                  {m.instructions && <div className="health-med-note">{m.instructions}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Medical History Timeline ───────────────────────── */}
        <section>
          <div className="section-header" style={{ marginBottom: 8 }}>
            <span className="section-title">Istorija bolesti — vremenska osa</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="section-count">{docs.length} dokumenata</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
                + Dodaj nalaz
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '24px 28px 18px' }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, marginTop: 0 }}>
              Kliknite na markicu da vidite dokument. Veće markice = tekuća bolest. Zelene markice = Vaš upload.
            </p>
            <MedicalTimeline docs={allTimeline} onSelect={setActiveDoc} />
          </div>

          {/* Highlighted current illness docs */}
          {currentDocs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Dokumenti vezani za tekuću bolest
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentDocs.map((d) => {
                  const m = DOC_TYPE[d.documentType] || DOC_TYPE.ANAMNEZA;
                  return (
                    <button key={d.id} className="health-doc-row" onClick={() => setActiveDoc(d)}>
                      <span className="health-doc-type-chip" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                      <span className="health-doc-title">{d.title}</span>
                      <span className="health-doc-author">
                        Dr. {d.author?.lastName} · {fmtDate(d.documentDate)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />}
      {activeDoc  && <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}
      {activeReq  && <DoctorPanel req={activeReq} allDocs={docs} onClose={() => setActiveReq(null)} />}
    </div>
  );
}
