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

export default function PatientFindDoctorPage() {
  const [doctors,  setDoctors]  = useState([]);
  const [requests, setRequests] = useState([]);
  const [ratings,  setRatings]  = useState({}); // { doctorId: { avgStars, count } }
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');
  const [toastOk,  setToastOk]  = useState(true);
  const [sending,  setSending]  = useState(null);
  const [search,   setSearch]   = useState('');

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
                          <div style={{
                            padding: '10px 0', fontSize: 13, fontWeight: 600,
                            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            ✓ Lekar Vas aktivno prati
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
    </div>
  );
}
