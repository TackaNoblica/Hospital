import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const api = (path, opts = {}) =>
  axios({
    url: `http://localhost:8081${path}`,
    headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` },
    ...opts,
  });

const DOCTOR_COLORS = [
  ['#6366f1','#8b5cf6'], ['#3b82f6','#06b6d4'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'], ['#f43f5e','#fb923c'],
];

const STATUS_META = {
  APPROVED: { label: 'Prati Vas',     color: '#059669', bg: '#d1fae5', border: '#a7f3d0', dot: '#10b981' },
  PENDING:  { label: 'Ceka odgovor',  color: '#d97706', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b' },
  REJECTED: { label: 'Odbijeno',      color: '#dc2626', bg: '#fee2e2', border: '#fecaca', dot: '#ef4444' },
};

function getEmailFromToken() {
  try {
    return JSON.parse(atob(localStorage.getItem('careafterToken').split('.')[1])).sub || '';
  } catch { return ''; }
}

function cardinalSpline(pts, t = 0.4) {
  if (pts.length < 2) return '';
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * t / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t / 3;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function RatingBellCurve({ ratings }) {
  const W = 280, H = 110, pL = 14, pR = 14, pT = 18, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB, barW = cW / 5;
  const COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e' };
  const counts = [1, 2, 3, 4, 5].map((s) => (ratings || []).filter((r) => r.stars === s).length);
  const maxC = Math.max(...counts, 1);
  const xOf = (i) => pL + i * barW + barW / 2;
  const yOf = (c) => pT + (1 - c / maxC) * cH;
  const pts = counts.map((c, i) => [xOf(i), yOf(c)]);
  const curve = cardinalSpline(pts);
  const areaPath = curve + ` L ${pts[4][0].toFixed(1)},${(pT + cH).toFixed(1)} L ${pts[0][0].toFixed(1)},${(pT + cH).toFixed(1)} Z`;
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>
        Raspored ocena · {total} {total === 1 ? 'ocena' : 'ocena'}
      </div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {curve && <path d={areaPath} fill="url(#bellGrad)" />}
        {counts.map((c, i) => {
          const bx = pL + i * barW + 3;
          const by = yOf(c);
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW - 6} height={pT + cH - by} fill={COLORS[i + 1]} opacity={0.2} rx={3} />
              {c > 0 && <text x={xOf(i)} y={by - 4} textAnchor="middle" fontSize={10} fill={COLORS[i + 1]} fontWeight="700">{c}</text>}
            </g>
          );
        })}
        {curve && <path d={curve} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={COLORS[i + 1]} stroke="white" strokeWidth={1.5} />
        ))}
        {[1, 2, 3, 4, 5].map((s, i) => (
          <text key={s} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize={11} fill="#9ca3af">{s}★</text>
        ))}
      </svg>
    </div>
  );
}

export default function PatientFindDoctorPage() {
  const [doctors,  setDoctors]  = useState([]);
  const [requests, setRequests] = useState([]);
  const [ratings,  setRatings]  = useState({}); // { doctorId: { avgStars, count } }
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');
  const [toastOk,  setToastOk]  = useState(true);
  const [sending,  setSending]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [ratingTarget,    setRatingTarget]    = useState(null);
  const [ratingModalDist, setRatingModalDist] = useState([]);
  const [ratingStars,     setRatingStars]     = useState(0);
  const [ratingHover,     setRatingHover]     = useState(0);
  const [ratingComment,   setRatingComment]   = useState('');
  const [loadingDist,     setLoadingDist]     = useState(false);
  const [savingRating,    setSavingRating]    = useState(false);
  const [reportTarget,    setReportTarget]    = useState(null);
  const [reportReason,    setReportReason]    = useState('');
  const [sendingReport,   setSendingReport]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, rq] = await Promise.all([
        api('/api/doctors'),
        api('/api/doctor-requests/my-requests'),
      ]);
      setDoctors(dr.data);
      setRequests(rq.data);
      // Load ratings for all doctors
      const ratingResults = await Promise.all(
        dr.data.map((d) => api(`/api/ratings/doctor/${d.id}`).then((r) => ({ id: d.id, ...r.data })).catch(() => ({ id: d.id })))
      );
      const map = {};
      ratingResults.forEach((r) => { map[r.id] = r; });
      setRatings(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3200);
  };

  const getReq = (doctorId) => requests.find((r) => r.doctor?.id === doctorId);

  const sendRequest = async (doctorId) => {
    setSending(doctorId);
    try {
      await api('/api/doctor-requests', { method: 'post', data: { doctorId } });
      showToast('Zahtev za pracenje je poslan!', true);
      load();
    } catch (e) {
      showToast(e.response?.data?.error ?? 'Greška pri slanju zahteva', false);
    } finally {
      setSending(null);
    }
  };

  const cancelRequest = async (requestId) => {
    try {
      await api(`/api/doctor-requests/${requestId}`, { method: 'delete' });
      showToast('Zahtev je otkazan', false);
      load();
    } catch {
      showToast('Greška pri otkazivanju', false);
    }
  };

  const openRatingModal = async (doc) => {
    setRatingTarget(doc); setRatingStars(0); setRatingHover(0); setRatingComment('');
    setLoadingDist(true);
    try {
      const res = await api(`/api/ratings/doctor/${doc.id}`);
      const fullRatings = res.data.ratings || [];
      setRatingModalDist(fullRatings);
      const myEmail = getEmailFromToken();
      const existing = fullRatings.find((r) => r.patient?.email === myEmail);
      if (existing) { setRatingStars(existing.stars); setRatingComment(existing.comment || ''); }
    } catch { setRatingModalDist([]); }
    finally { setLoadingDist(false); }
  };

  const submitRating = async () => {
    if (!ratingStars || !ratingTarget) return;
    setSavingRating(true);
    try {
      await api('/api/ratings', { method: 'post', data: { doctorId: ratingTarget.id, stars: ratingStars, comment: ratingComment } });
      showToast('Ocena je sačuvana! Hvala Vam.', true);
      setRatingTarget(null); setRatingStars(0); setRatingComment('');
      load();
    } catch { showToast('Greška pri čuvanju ocene.', false); }
    finally { setSavingRating(false); }
  };

  const openReportModal = (doc) => { setReportTarget(doc); setReportReason(''); };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportTarget) return;
    setSendingReport(true);
    try {
      await api('/api/reports', { method: 'post', data: { reportedUserId: reportTarget.id, reportType: 'PATIENT_REPORTS_DOCTOR', reason: reportReason } });
      showToast('Prijava je podneta.', true);
      setReportTarget(null); setReportReason('');
    } catch (e) { showToast(e.response?.data?.error ?? 'Greška pri podnošenju prijave.', false); }
    finally { setSendingReport(false); }
  };

  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const pendingCount  = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page">

          {/* Header */}
          <div className="page-head">
            <div>
              <h1 className="page-title">Moji lekari</h1>
              <p className="page-sub">Pratite lekara i on ce pratiti Vas oporavak</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {approvedCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                  border: '1px solid #10b981',
                }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: '#065f46', lineHeight: 1 }}>{approvedCount}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', lineHeight: 1.3 }}>Aktivnih<br/>lekara</div>
                </div>
              )}
              {pendingCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                  border: '1px solid #f59e0b',
                }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: '#78350f', lineHeight: 1 }}>{pendingCount}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', lineHeight: 1.3 }}>Na<br/>cekanju</div>
                </div>
              )}
            </div>
          </div>

          {/* Info banner */}
          <div style={{
            marginBottom: 24, padding: '14px 18px',
            background: 'var(--primary-bg)', border: '1px solid var(--primary-light)',
            borderRadius: 12, fontSize: 13, color: 'var(--primary-dark)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>ℹ️</span>
            <span>Posaljite zahtev lekaru — kada prihvati, mozete pratiti jedan drugog i komunicirati u chatu.</span>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretražite po imenu ili ustanovi..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px 10px 38px',
                  border: '1.5px solid var(--border)', borderRadius: 10,
                  fontSize: 14, background: 'var(--surface)',
                  color: 'var(--text)', outline: 'none',
                }}
              />
            </div>
            {search && (
              <button onClick={() => setSearch('')}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--muted)' }}>
                Obriši
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Ucitavanje lekara...</div>
          ) : doctors.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">👨‍⚕️</div>
              <h3>Nema dostupnih lekara</h3>
              <p>Pokusajte ponovo kasnije.</p>
            </div>
          ) : (
            <div className="patients-grid">
              {doctors.filter((doc) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const name = `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.toLowerCase();
                const specialty = (doc.specialty ?? 'Internista — Specijalista pulmologije').toLowerCase();
                const hospital = (doc.hospital ?? 'Klinika za pulmologiju, KBC').toLowerCase();
                return name.includes(q) || specialty.includes(q) || hospital.includes(q);
              }).map((doc, idx) => {
                const req  = getReq(doc.id);
                const meta = req ? STATUS_META[req.status] : null;
                const g    = DOCTOR_COLORS[idx % DOCTOR_COLORS.length];

                return (
                  <div key={doc.id} className="card" style={{ overflow: 'hidden', transition: 'box-shadow .15s, transform .15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                  >
                    {/* Card top gradient band */}
                    <div style={{
                      height: 6,
                      background: `linear-gradient(90deg,${g[0]},${g[1]})`,
                    }} />

                    <div style={{ padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 68, height: 68, borderRadius: '50%',
                        background: `linear-gradient(135deg,${g[0]},${g[1]})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 900, color: 'white',
                        boxShadow: `0 6px 20px ${g[0]}55`,
                        marginTop: -4,
                      }}>
                        {doc.firstName?.[0]}{doc.lastName?.[0]}
                      </div>

                      {/* Name & speciality */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                          {doc.firstName} {doc.lastName}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, marginTop: 3 }}>
                          {doc.specialty ?? 'Internista — Specijalista pulmologije'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {doc.hospital ?? 'Klinika za pulmologiju, KBC'}
                        </div>
                        {ratings[doc.id]?.avgStars && (
                          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginTop: 4 }}>
                            {'★'.repeat(Math.round(ratings[doc.id].avgStars))}{'☆'.repeat(5 - Math.round(ratings[doc.id].avgStars))}
                            {' '}<span style={{ color: 'var(--muted)', fontWeight: 500 }}>{ratings[doc.id].avgStars} ({ratings[doc.id].count})</span>
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      {meta && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '5px 14px', borderRadius: 999,
                          background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                          fontSize: 12, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                          {meta.label}
                        </div>
                      )}

                      {/* Action button */}
                      <div style={{ width: '100%', marginTop: 4 }}>
                        {!req && (
                          <button
                            className="btn btn-primary btn-block"
                            style={{ fontSize: 13.5 }}
                            disabled={sending === doc.id}
                            onClick={() => sendRequest(doc.id)}
                          >
                            {sending === doc.id ? '...' : '+ Zaprati lekara'}
                          </button>
                        )}
                        {req?.status === 'PENDING' && (
                          <button
                            className="btn btn-ghost btn-block"
                            style={{ fontSize: 13, color: '#d97706', borderColor: '#fde68a' }}
                            onClick={() => cancelRequest(req.id)}
                          >
                            Otkaži zahtev
                          </button>
                        )}
                        {req?.status === 'APPROVED' && (
                          <div style={{ width: '100%' }}>
                            <div style={{ textAlign: 'center', fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
                              ✓ Lekar Vas aktivno prati
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => openRatingModal(doc)}
                                style={{ flex: 1, padding: '7px 0', border: '1.5px solid #fde68a', borderRadius: 8, background: '#fffbeb', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                ⭐ Oceni
                              </button>
                              <button
                                onClick={() => openReportModal(doc)}
                                style={{ flex: 1, padding: '7px 0', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fff5f5', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                🚩 Prijavi
                              </button>
                            </div>
                          </div>
                        )}
                        {req?.status === 'REJECTED' && (
                          <button
                            className="btn btn-ghost btn-block"
                            style={{ fontSize: 13 }}
                            onClick={() => sendRequest(doc.id)}
                          >
                            Posalji zahtev ponovo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div className="toast" style={{ background: toastOk ? '#10b981' : '#ef4444' }}>
          {toastOk ? '✓' : '✕'} {toast}
        </div>
      )}

      {/* ── Rating modal ── */}
      {ratingTarget && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000077', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setRatingTarget(null)}>
          <div className="card" style={{ width: 360, padding: '28px 24px 22px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>⭐</div>
            <h3 style={{ marginBottom: 4 }}>Ocenite lekara</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
              Dr. {ratingTarget.firstName} {ratingTarget.lastName}
            </p>

            {/* Bell curve */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 8px', marginBottom: 18 }}>
              {loadingDist ? (
                <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Učitavanje...
                </div>
              ) : (
                <RatingBellCurve ratings={ratingModalDist} />
              )}
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}
                  onMouseEnter={() => setRatingHover(s)}
                  onMouseLeave={() => setRatingHover(0)}
                  onClick={() => setRatingStars(s)}
                  style={{ fontSize: 36, cursor: 'pointer', lineHeight: 1, color: s <= (ratingHover || ratingStars) ? '#f59e0b' : '#d1d5db', transition: 'color .1s' }}>
                  ★
                </span>
              ))}
            </div>
            {ratingStars > 0 && (
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>
                {['', 'Loše', 'Ispod proseka', 'Prosečno', 'Dobro', 'Odlično'][ratingStars]}
              </div>
            )}
            <textarea
              placeholder="Ostavite komentar (opciono)..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, resize: 'vertical', marginBottom: 18, background: 'var(--surface)', color: 'var(--text)' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRatingTarget(null)}>Otkaži</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!ratingStars || savingRating} onClick={submitRating}>
                {savingRating ? 'Čuvanje...' : 'Pošalji ocenu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report modal ── */}
      {reportTarget && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000077', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setReportTarget(null)}>
          <div className="card" style={{ width: 400, padding: '28px 28px 24px' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8, color: '#ef4444' }}>🚩 Prijava lekara</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              Dr. {reportTarget.firstName} {reportTarget.lastName}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
              Zdravstvena ustanova će pregledati Vašu prijavu. Prva prijava šalje upozorenje lekaru.
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Razlog prijave:</label>
            <textarea
              placeholder="Opišite problem — neprofesionalno ponašanje, neodgovaranje na poruke..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13.5, resize: 'vertical', marginBottom: 20, background: 'var(--surface)', color: 'var(--text)' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReportTarget(null)}>Otkaži</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                disabled={!reportReason.trim() || sendingReport} onClick={submitReport}>
                {sendingReport ? 'Slanje...' : 'Pošalji prijavu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
