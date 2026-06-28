import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 60)  return `Pre ${m} min`;
  if (h < 24)  return `Pre ${h}h`;
  return `Pre ${Math.floor(h / 24)} dana`;
};

const fmtApptShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const apptDay = new Date(d); apptDay.setHours(0,0,0,0);
  const diff = Math.ceil((apptDay - today) / 86400000);
  const time = d.toLocaleString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Danas, ${time}`;
  if (diff === 1) return `Sutra, ${time}`;
  if (diff < 0)  return `Pre ${Math.abs(diff)} dana`;
  return `Za ${diff} dana, ${time}`;
};

const AVATAR_GRADIENTS = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#d946ef'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'], ['#f43f5e','#fb923c'],
];

const NOTIF_META = {
  ALARM_CHECKIN:       { dot: '#ef4444', icon: '🚨', label: 'Alarm' },
  WARN_CHECKIN:        { dot: '#f59e0b', icon: '⚠️',  label: 'Upozorenje' },
  INFO_CHECKIN:        { dot: '#6366f1', icon: '📋',  label: 'Dekurzus' },
  URGENT_MESSAGE:      { dot: '#ef4444', icon: '💬',  label: 'Hitna poruka' },
  MEDICATION_REMINDER: { dot: '#10b981', icon: '💊',  label: 'Terapija' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [notifs,   setNotifs]   = useState([]);
  const [patients, setPatients] = useState([]);
  const [allAppts, setAllAppts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [notifRes, patRes] = await Promise.all([
        client.get('/api/notifications/me'),
        client.get('/api/patients/doctor'),
      ]);
      // Sort: alarms first, then by date desc
      const sorted = [...notifRes.data].sort((a, b) => {
        const aIsAlarm = a.type === 'ALARM_CHECKIN' || a.type === 'URGENT_MESSAGE';
        const bIsAlarm = b.type === 'ALARM_CHECKIN' || b.type === 'URGENT_MESSAGE';
        if (aIsAlarm !== bIsAlarm) return aIsAlarm ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setNotifs(sorted);
      setPatients(patRes.data);

      const apptResults = await Promise.all(
        patRes.data.map((p) =>
          client.get(`/api/patients/${p.id}/appointments`)
            .then((r) => r.data.map((a) => ({ ...a, _patName: `${p.user?.firstName} ${p.user?.lastName}`, _pid: p.id })))
            .catch(() => [])
        )
      );
      const now = new Date();
      const upcoming = apptResults
        .flat()
        .filter((a) => new Date(a.appointmentDate) >= now)
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        .slice(0, 6);
      setAllAppts(upcoming);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const markRead = async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      showToast('Greska pri oznacavanju.');
    }
  };

  const alarmCount  = notifs.filter((n) => (n.type === 'ALARM_CHECKIN' || n.type === 'URGENT_MESSAGE') && !n.isRead).length;
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="layout">
      <Sidebar alertCount={alarmCount} notifCount={unreadCount} />
      <div className="main-area">
        <div className="page">
          <div className="page-head">
            <div>
              <h1 className="page-title">
                {(() => {
                  const h = new Date().getHours();
                  const name = localStorage.getItem('careafterName')?.split(' ')[0];
                  const greeting = h < 12 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobro vece';
                  return name ? `${greeting}, ${name}` : 'Tabla lekara';
                })()}
              </h1>
              <p className="page-sub">Pregled obaveštenja od pacijenata i predstojecih pregleda.</p>
            </div>
            <button className="btn btn-ghost" onClick={load} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6M19 16v-6h-6"/><path d="M17.7 8A8 8 0 105.6 17.3"/></svg>
              Osvezi
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card indigo" style={{ cursor: 'pointer' }} onClick={() => navigate('/patients')}>
              <div className="stat-icon">👥</div>
              <div className="stat-num">{patients.length}</div>
              <div className="stat-label">Moji pacijenti</div>
            </div>
            <div className={`stat-card ${alarmCount > 0 ? 'red' : 'white'}`}>
              <div className="stat-icon">🚨</div>
              <div className="stat-num" style={alarmCount === 0 ? { color: 'var(--text)' } : {}}>{alarmCount}</div>
              <div className="stat-label" style={alarmCount === 0 ? { color: 'var(--muted)', opacity: 1 } : {}}>Alarmi (neprocitani)</div>
            </div>
            <div className={`stat-card ${unreadCount > 0 ? 'amber' : 'white'}`}>
              <div className="stat-icon">🔔</div>
              <div className="stat-num" style={unreadCount === 0 ? { color: 'var(--text)' } : {}}>{unreadCount}</div>
              <div className="stat-label" style={unreadCount === 0 ? { color: 'var(--muted)', opacity: 1 } : {}}>Sva obavestenja</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">📅</div>
              <div className="stat-num">{allAppts.length}</div>
              <div className="stat-label">Predstojecu pregledi</div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Notifications */}
            <div>
              <div className="section-header">
                <span className="section-title">Obavestenja</span>
                <span className="section-count">{notifs.length}</span>
              </div>

              {loading ? (
                <div className="loading">Ucitavanje...</div>
              ) : notifs.length === 0 ? (
                <div className="card card-pad" style={{ textAlign: 'center', padding: '44px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-2)', marginBottom: 4 }}>Sve je u redu!</div>
                  <div style={{ fontSize: 13 }}>Nema obavestenja.</div>
                </div>
              ) : (
                <div className="alert-list">
                  {notifs.map((n) => {
                    const meta = NOTIF_META[n.type] || NOTIF_META.INFO_CHECKIN;
                    const isAlarm = n.type === 'ALARM_CHECKIN' || n.type === 'URGENT_MESSAGE';
                    return (
                      <div key={n.id} className={`alert-card ${isAlarm ? 'risk-red' : n.isRead ? '' : 'risk-yellow'}`}
                        style={{ opacity: n.isRead ? 0.6 : 1 }}>
                        <div className="alert-main">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>{meta.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: meta.dot, background: meta.dot + '18',
                              padding: '2px 8px', borderRadius: 10 }}>{meta.label}</span>
                            {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />}
                          </div>
                          <div className="alert-text">
                            <strong>{n.title}</strong>
                            <span className="alert-msg">{n.message}</span>
                          </div>
                          {n.patient && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                              Pacijent: {n.patient.user?.firstName} {n.patient.user?.lastName}
                            </div>
                          )}
                        </div>
                        <div className="alert-side">
                          <span className="alert-time">{fmtRelative(n.createdAt)}</span>
                          {!n.isRead && (
                            <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                              Procitano
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div>
              {/* Upcoming appointments */}
              <div className="section-header">
                <span className="section-title">Predstojecu pregledi</span>
              </div>
              <div className="card mb-24" style={{ marginBottom: 20 }}>
                {allAppts.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>📅</div>
                    Nema zakazanih pregleda
                  </div>
                ) : allAppts.map((a, i) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/patients/${a._pid}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', cursor: 'pointer',
                      borderBottom: i < allAppts.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'var(--primary-bg)', border: '1px solid var(--primary-light)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                        {new Date(a.appointmentDate).getDate()}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                        {new Date(a.appointmentDate).toLocaleString('sr-RS', { month: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a._patName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {a.appointmentType} &middot; {fmtApptShort(a.appointmentDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick patient list */}
              <div className="section-header">
                <span className="section-title">Moji pacijenti</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>
                  Svi →
                </button>
              </div>
              <div className="card">
                {patients.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Nema pacijenata</div>
                ) : patients.map((p, i) => {
                  const g = AVATAR_GRADIENTS[p.id % AVATAR_GRADIENTS.length];
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/patients/${p.id}`, { state: { patient: p } })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 16px', cursor: 'pointer',
                        borderBottom: i < patients.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background .12s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg,${g[0]},${g[1]})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.user?.firstName} {p.user?.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.diagnosis}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--muted-light)" strokeWidth="2" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}
