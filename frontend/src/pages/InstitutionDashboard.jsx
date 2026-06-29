import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const api = (path, opts = {}) =>
  axios({
    url: `http://localhost:8081${path}`,
    headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` },
    ...opts,
  });

const DOC_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f97316', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899'];

function buildKde(data, xMin = 0.5, xMax = 5.5, steps = 350) {
  const n = data.length;
  if (n === 0) return [];
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = (n > 1 ? data.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1) : 0.25);
  const h = Math.max(0.18, Math.min(0.9, 1.06 * Math.sqrt(variance) * Math.pow(n, -0.2)));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * (xMax - xMin) / steps;
    const density = data.reduce((s, xi) => s + Math.exp(-0.5 * ((x - xi) / h) ** 2) / (h * Math.sqrt(2 * Math.PI)), 0) / n;
    pts.push([x, density]);
  }
  return pts;
}

function RatingKDE({ allRatings, doctorRatingMap, officialAvg }) {
  const W = 640, H = 190, pL = 10, pR = 20, pT = 38, pB = 44;
  const cW = W - pL - pR, cH = H - pT - pB;
  const xMin = 0.5, xMax = 5.5;
  const toSvgX = (x) => pL + ((x - xMin) / (xMax - xMin)) * cW;
  const baseY = pT + cH;
  const data = (allRatings || []).map((r) => r.stars);
  const n = data.length;

  if (n === 0) return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, textAlign: 'center', color: 'var(--muted)', marginBottom: 24 }}>
      Nema ocena za prikaz distribucije.
    </div>
  );

  const mean = officialAvg != null ? Number(officialAvg) : (data.reduce((a, b) => a + b, 0) / n);
  const kdePts = buildKde(data);
  const maxD = Math.max(...kdePts.map((p) => p[1]), 0.01);
  const toSvgY = (y) => pT + cH - (y / maxD) * cH;

  const curvePath = kdePts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`).join(' ');
  const areaPath  = curvePath + ` L${toSvgX(xMax).toFixed(1)},${baseY} L${toSvgX(xMin).toFixed(1)},${baseY} Z`;
  const avgX = toSvgX(mean);

  // Jitter dots at same star value
  const byStars = {};
  (allRatings || []).forEach((r) => { if (!byStars[r.stars]) byStars[r.stars] = []; byStars[r.stars].push(r); });
  const dots = [];
  Object.entries(byStars).forEach(([star, list]) => {
    const k = list.length;
    const spread = Math.min(0.28, (k - 1) * 0.07);
    list.forEach((r, j) => {
      const offset = k === 1 ? 0 : (j / (k - 1) - 0.5) * 2 * spread;
      dots.push({ ...r, cx: toSvgX(Number(star) + offset) });
    });
  });

  const pctile = Math.round((data.filter((x) => x <= mean).length / n) * 100);
  const xTicks = [1, 2, 3, 4, 5];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px 14px', marginBottom: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
        Distribucija ocena — poređenje lekara
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
        KDE kriva {n} {n === 1 ? 'ocene' : 'ocena'}. Prosečna ocena je{' '}
        <strong style={{ color: 'var(--text)' }}>{mean.toFixed(1)}★</strong>{' '}
        ({pctile}. percentil).
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="kdeGradInst" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line x1={pL} y1={baseY} x2={W - pR} y2={baseY} stroke="#e5e7eb" strokeWidth={1.5} />

        {/* Dashed vertical grid at each star */}
        {xTicks.map((s) => (
          <line key={s} x1={toSvgX(s)} y1={pT} x2={toSvgX(s)} y2={baseY}
            stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3,4" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#kdeGradInst)" />

        {/* KDE curve */}
        <path d={curvePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Average dashed marker line */}
        <line x1={avgX} y1={pT - 4} x2={avgX} y2={baseY}
          stroke="#6366f1" strokeWidth={1.5} strokeDasharray="5,4" />

        {/* ▼ label at top */}
        <text x={avgX} y={pT - 14} textAnchor="middle" fontSize={12} fontWeight="700" fill="#6366f1">
          ▼ {mean.toFixed(1)}★
        </text>

        {/* Dots for individual ratings */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={baseY} r={5}
            fill={d.color} stroke="white" strokeWidth={1.5} opacity={0.85} />
        ))}

        {/* X-axis ticks + labels */}
        {xTicks.map((s) => (
          <g key={s}>
            <line x1={toSvgX(s)} y1={baseY} x2={toSvgX(s)} y2={baseY + 5} stroke="#9ca3af" strokeWidth={1.5} />
            <text x={toSvgX(s)} y={baseY + 18} textAnchor="middle" fontSize={12} fill="#9ca3af">{s}★</text>
          </g>
        ))}

        {/* Range labels */}
        <text x={toSvgX(1)} y={baseY + 32} textAnchor="middle" fontSize={11} fill="#d1d5db">loše</text>
        <text x={toSvgX(5)} y={baseY + 32} textAnchor="middle" fontSize={11} fill="#d1d5db">odlično</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginTop: 8 }}>
        {Object.entries(doctorRatingMap || {}).filter(([, d]) => d.ratings && d.ratings.length > 0).map(([id, d]) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, border: '1.5px solid white', boxShadow: `0 0 0 1px ${d.color}55`, flexShrink: 0 }} />
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} ({d.avg ? `${d.avg}★` : '—'})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stars({ value, size = 14 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(value) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

export default function InstitutionDashboard() {
  const [doctors,      setDoctors]      = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [reports,      setReports]      = useState([]);
  const [stats,        setStats]        = useState(null);
  const [allDoctors,   setAllDoctors]   = useState([]);
  const [tab,          setTab]          = useState('doctors');
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState('');
  const [toastOk,      setToastOk]      = useState(true);
  const [banModal,     setBanModal]     = useState(null);
  const [banDays,      setBanDays]      = useState(30);
  const [search,       setSearch]       = useState('');
  const [allRatings,      setAllRatings]      = useState([]);
  const [doctorRatingMap, setDoctorRatingMap] = useState({});

  const showToast = (msg, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, rq, rp, st, all] = await Promise.all([
        api('/api/institution/doctors'),
        api('/api/institution/pending-requests'),
        api('/api/reports/institution'),
        api('/api/institution/stats'),
        api('/api/institution/all-doctors'),
      ]);
      setDoctors(dr.data);
      setRequests(rq.data);
      setReports(rp.data);
      setStats(st.data);
      setAllDoctors(all.data);

      // Fetch ratings for each approved doctor
      const ratingResponses = await Promise.all(
        dr.data.map((doc, i) =>
          api(`/api/ratings/doctor/${doc.id}`)
            .then((r) => ({ doctorId: doc.id, name: `${doc.firstName} ${doc.lastName}`, ratings: r.data.ratings || [], color: DOC_COLORS[i % DOC_COLORS.length] }))
            .catch(() => ({ doctorId: doc.id, name: `${doc.firstName} ${doc.lastName}`, ratings: [], color: DOC_COLORS[i % DOC_COLORS.length] }))
        )
      );
      const flat = [], docMap = {};
      ratingResponses.forEach((d) => {
        const avg = d.ratings.length ? (d.ratings.reduce((s, r) => s + r.stars, 0) / d.ratings.length).toFixed(1) : null;
        docMap[d.doctorId] = { name: d.name, color: d.color, ratings: d.ratings, avg };
        d.ratings.forEach((r) => flat.push({ stars: r.stars, doctorId: d.doctorId, color: d.color }));
      });
      setAllRatings(flat);
      setDoctorRatingMap(docMap);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const followDoctor = async (doctorId) => {
    try {
      await api(`/api/institution/follow/${doctorId}`, { method: 'post' });
      showToast('Zahtev poslat lekaru');
      load();
    } catch (e) {
      showToast(e.response?.data?.error ?? 'Greška', false);
    }
  };

  const warnDoctor = async (reportId) => {
    try {
      await api(`/api/reports/${reportId}/warn`, { method: 'post' });
      showToast('Upozorenje poslato lekaru');
      load();
    } catch {
      showToast('Greška pri slanju upozorenja', false);
    }
  };

  const banDoctor = async () => {
    if (!banModal) return;
    try {
      await api(`/api/reports/${banModal.id}/ban`, { method: 'post', data: { days: banDays } });
      showToast(`Profil lekara zabranjen na ${banDays} dana`);
      setBanModal(null);
      load();
    } catch {
      showToast('Greška pri zabrani profila', false);
    }
  };

  const isoDate = (iso) => iso ? new Date(iso).toLocaleDateString('sr-Latn') : '—';

  const pendingFollowIds = new Set(requests.map((r) => r.doctor?.id));
  const approvedIds = new Set(doctors.map((d) => d.id));

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page">

          <div className="page-head">
            <div>
              <h1 className="page-title">Kontrolna tabla ustanove</h1>
              <p className="page-sub">Upravljajte lekarima vaše zdravstvene ustanove</p>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Aktivnih lekara', value: stats.doctorCount, color: '#6366f1', bg: '#ede9fe' },
                { label: 'Na čekanju', value: stats.pendingRequests, color: '#f59e0b', bg: '#fef3c7' },
                { label: 'Prijava lekara', value: stats.totalReports, color: '#ef4444', bg: '#fee2e2' },
                { label: 'Prosečna ocena', value: stats.avgRating ? `${stats.avgRating} ★` : '—', color: '#f59e0b', bg: '#fffbeb' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: '1 1 140px', padding: '16px 20px', borderRadius: 14,
                  background: s.bg, border: `1px solid ${s.color}33`,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* KDE Rating Distribution */}
          {!loading && <RatingKDE allRatings={allRatings} doctorRatingMap={doctorRatingMap} officialAvg={stats?.avgRating} />}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
            {[
              { key: 'doctors', label: 'Moji lekari' },
              { key: 'follow', label: 'Dodaj lekara' },
              { key: 'reports', label: `Prijave (${reports.length})` },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: 'none', borderBottom: tab === t.key ? '3px solid var(--primary)' : '3px solid transparent',
                color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
                marginBottom: -2,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">Učitavanje...</div>
          ) : tab === 'doctors' ? (
            <>
              {doctors.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🏥</div>
                  <h3>Nemate praćenih lekara</h3>
                  <p>Idite na "Dodaj lekara" da biste poslali zahtev.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {doctors.map((doc) => (
                    <div key={doc.id} className="card" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 900, color: 'white', flexShrink: 0,
                        }}>
                          {(doc.firstName?.startsWith('Dr.') ? doc.firstName.slice(4).trim() : doc.firstName)?.[0]}{doc.lastName?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15.5 }}>{doc.firstName?.startsWith('Dr.') ? `${doc.firstName} ${doc.lastName}` : `Dr. ${doc.firstName} ${doc.lastName}`}</div>
                          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{doc.specialty ?? '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{doc.hospital ?? '—'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              {doc.avgStars ? <><Stars value={doc.avgStars} /> <span style={{ marginLeft: 4 }}>{doc.avgStars}</span></> : '—'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{doc.ratingCount} ocena</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: doc.reportCount > 0 ? '#ef4444' : '#10b981' }}>
                              {doc.reportCount}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>prijava</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: doc.warningCount > 0 ? '#f59e0b' : '#6b7280' }}>
                              {doc.warningCount ?? 0}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>upozorenja</div>
                          </div>
                        </div>
                        {doc.bannedUntil && (
                          <div style={{
                            padding: '4px 12px', borderRadius: 999,
                            background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700,
                          }}>
                            Zabranjen do {isoDate(doc.bannedUntil)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : tab === 'follow' ? (
            <>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pretražite lekara po imenu ili specijalnosti..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 14px 10px 38px',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    fontSize: 14, background: 'var(--surface)', color: 'var(--text)',
                  }} />
              </div>
              <div className="patients-grid">
                {allDoctors.filter((d) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (`${d.firstName} ${d.lastName}`).toLowerCase().includes(q)
                    || (d.specialty ?? '').toLowerCase().includes(q)
                    || (d.hospital ?? '').toLowerCase().includes(q);
                }).map((doc) => {
                  const isApproved = approvedIds.has(doc.id);
                  const isPending  = pendingFollowIds.has(doc.id);
                  return (
                    <div key={doc.id} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ height: 5, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                      <div style={{ padding: '18px 18px 16px', textAlign: 'center' }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, fontWeight: 900, color: 'white',
                        }}>
                          {doc.firstName?.[0]}{doc.lastName?.[0]}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{doc.firstName} {doc.lastName}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{doc.specialty ?? '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{doc.hospital ?? '—'}</div>
                        <div style={{ marginTop: 14 }}>
                          {isApproved ? (
                            <div style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>✓ Praćen</div>
                          ) : isPending ? (
                            <div style={{ color: '#d97706', fontWeight: 700, fontSize: 13 }}>⏳ Čeka odgovor</div>
                          ) : (
                            <button className="btn btn-primary btn-block" style={{ fontSize: 13 }}
                              onClick={() => followDoctor(doc.id)}>
                              + Prati lekara
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {reports.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📋</div>
                  <h3>Nema prijava</h3>
                  <p>Vaši lekari nemaju prijava od pacijenata.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reports.map((rep) => (
                    <div key={rep.id} className="card" style={{ padding: '18px 22px', borderLeft: `4px solid ${rep.status === 'BANNED' ? '#ef4444' : rep.status === 'WARNING_SENT' ? '#f59e0b' : '#6366f1'}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            Dr. {rep.reportedUser?.firstName} {rep.reportedUser?.lastName}
                            <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 10px', borderRadius: 999,
                              background: rep.status === 'BANNED' ? '#fee2e2' : rep.status === 'WARNING_SENT' ? '#fef3c7' : '#ede9fe',
                              color: rep.status === 'BANNED' ? '#dc2626' : rep.status === 'WARNING_SENT' ? '#d97706' : '#6366f1',
                              fontWeight: 700 }}>
                              {rep.status === 'BANNED' ? 'Zabranjen' : rep.status === 'WARNING_SENT' ? 'Upozoren' : 'Čeka'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                            Pacijent: {rep.reporter?.firstName} {rep.reporter?.lastName} · {isoDate(rep.createdAt)}
                          </div>
                          <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text)' }}>{rep.reason}</div>
                        </div>
                        {rep.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px', borderColor: '#f59e0b', color: '#d97706' }}
                              onClick={() => warnDoctor(rep.id)}>
                              ⚠️ Upozori
                            </button>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px', borderColor: '#ef4444', color: '#dc2626' }}
                              onClick={() => setBanModal(rep)}>
                              🚫 Zabrani profil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ban modal */}
      {banModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 360, padding: '28px 28px 24px' }}>
            <h3 style={{ marginBottom: 8 }}>Zabrana profila</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Dr. {banModal.reportedUser?.firstName} {banModal.reportedUser?.lastName} — odaberite trajanje zabrane:
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Broj dana:</label>
            <input type="number" min={1} max={365} value={banDays} onChange={(e) => setBanDays(Number(e.target.value))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setBanModal(null)}>Otkaži</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                onClick={banDoctor}>
                Zabrani
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ background: toastOk ? '#10b981' : '#ef4444' }}>
          {toastOk ? '✓' : '✕'} {toast}
        </div>
      )}
    </div>
  );
}
