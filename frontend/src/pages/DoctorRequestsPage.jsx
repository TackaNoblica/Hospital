import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const api = (path, opts = {}) =>
  axios({
    url: `http://localhost:8081${path}`,
    headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` },
    ...opts,
  });

const AVATAR_G = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#d946ef'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'], ['#f43f5e','#fb923c'],
];

function ago(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'malopre';
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)}h`;
  return `pre ${Math.floor(diff / 86400)} dana`;
}

export default function DoctorRequestsPage() {
  const [pending,  setPending]  = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');
  const [toastOk,  setToastOk]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        api('/api/doctor-requests/pending'),
        api('/api/doctor-requests/my-patients'),
      ]);
      setPending(p.data);
      setApproved(a.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3200);
  };

  const approve = async (id) => {
    try {
      await api(`/api/doctor-requests/${id}/approve`, { method: 'post' });
      showToast('Zahtev prihvacen — razgovor je kreiran automatski', true);
      load();
    } catch { showToast('Greška pri prihvatanju zahteva', false); }
  };

  const reject = async (id) => {
    try {
      await api(`/api/doctor-requests/${id}/reject`, { method: 'post' });
      showToast('Zahtev odbijen', false);
      load();
    } catch { showToast('Greška pri odbijanju zahteva', false); }
  };

  return (
    <div className="layout">
      <Sidebar requestCount={pending.length} />
      <div className="main-area">
        <div className="page">

          {/* Header */}
          <div className="page-head">
            <div>
              <h1 className="page-title">Zahtevi za pracenje</h1>
              <p className="page-sub">Pacijenti koji zele da budu pod Vasim nadzorom</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {pending.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                  border: '1px solid #f59e0b',
                }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: '#78350f', lineHeight: 1 }}>{pending.length}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', lineHeight: 1.3 }}>Na<br/>cekanju</div>
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 12,
                background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
                border: '1px solid #10b981',
              }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#065f46', lineHeight: 1 }}>{approved.length}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', lineHeight: 1.3 }}>Aktivnih<br/>pacijenata</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Ucitavanje zahteva...</div>
          ) : (
            <>
              {/* PENDING REQUESTS */}
              {pending.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div className="section-header" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="section-title">Novi zahtevi</span>
                      <span style={{
                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: 999, fontSize: 11, fontWeight: 800,
                        padding: '2px 8px', minWidth: 20, textAlign: 'center',
                      }}>{pending.length}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pending.map((req) => {
                      const u = req.patient?.user;
                      const g = AVATAR_G[(req.patient?.id ?? 0) % AVATAR_G.length];
                      return (
                        <div key={req.id} className="card" style={{
                          display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px',
                          borderLeft: '4px solid #f59e0b', transition: 'box-shadow .15s',
                        }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                            background: `linear-gradient(135deg,${g[0]},${g[1]})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 800, color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                          }}>
                            {u?.firstName?.[0]}{u?.lastName?.[0]}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                              {u ? `${u.firstName} ${u.lastName}` : 'Nepoznat pacijent'}
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🏥 {req.patient?.diagnosis || 'Dijagnoza nije navedena'}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted-light)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                              Zahtev poslan {ago(req.requestedAt)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => approve(req.id)}
                              style={{ gap: 6 }}
                            >
                              ✓ Prihvati
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => reject(req.id)}
                              style={{ gap: 6 }}
                            >
                              ✕ Odbij
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pending.length === 0 && (
                <div className="card card-pad" style={{
                  marginBottom: 32, textAlign: 'center', padding: '32px 20px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>Nema novih zahteva</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Svi zahtevi su obradjeni.</div>
                </div>
              )}

              {/* APPROVED PATIENTS */}
              <div>
                <div className="section-header" style={{ marginBottom: 16 }}>
                  <span className="section-title">Moji pacijenti</span>
                  <span className="section-count">{approved.length} pacijenata</span>
                </div>

                {approved.length === 0 ? (
                  <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-2)', marginBottom: 4 }}>Nemate odobrenih pacijenata</div>
                    <div style={{ fontSize: 13 }}>Kada prihvatite zahtev, pacijent ce se pojaviti ovde.</div>
                  </div>
                ) : (
                  <div className="patients-grid">
                    {approved.map((req) => {
                      const u = req.patient?.user;
                      const g = AVATAR_G[(req.patient?.id ?? 0) % AVATAR_G.length];
                      return (
                        <div key={req.id} className="card" style={{ padding: '22px', transition: 'box-shadow .15s, transform .15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                            <div style={{
                              width: 60, height: 60, borderRadius: '50%',
                              background: `linear-gradient(135deg,${g[0]},${g[1]})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 22, fontWeight: 800, color: 'white',
                              boxShadow: '0 4px 16px rgba(0,0,0,.18)',
                            }}>
                              {u?.firstName?.[0]}{u?.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>
                                {u ? `${u.firstName} ${u.lastName}` : 'Nepoznat'}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                                {req.patient?.hospitalDepartment || 'Pulmologija'}
                              </div>
                            </div>
                            <div style={{
                              fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
                              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            }}>
                              {req.patient?.diagnosis || '—'}
                            </div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 12px', borderRadius: 999,
                              background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0',
                              fontSize: 11.5, fontWeight: 700,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                              Aktivno pracenje
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
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
