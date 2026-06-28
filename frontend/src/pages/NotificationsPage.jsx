import { useEffect, useState } from 'react';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
};

const fmtRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2)  return 'Upravo';
  if (m < 60) return `Pre ${m} min`;
  if (h < 24) return `Pre ${h}h`;
  if (d === 1) return 'Juce';
  return `Pre ${d} dana`;
};

const TYPE_META = {
  ALERT:               { icon: '🚨', label: 'Upozorenje',   color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  APPOINTMENT:         { icon: '📅', label: 'Pregled',       color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  REMINDER:            { icon: '⏰', label: 'Podsetnik',     color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  INFO:                { icon: 'ℹ️', label: 'Informacija',   color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  UPDATE:              { icon: '📋', label: 'Azuriranje',    color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  MEDICATION_REMINDER: { icon: '💊', label: 'Terapija',      color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  ALARM_CHECKIN:       { icon: '🚨', label: 'Alarm',         color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  WARN_CHECKIN:        { icon: '⚠️', label: 'Upozorenje',    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  INFO_CHECKIN:        { icon: '📋', label: 'Dekurzus',      color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  URGENT_MESSAGE:      { icon: '💬', label: 'Hitna poruka',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

const fallbackMeta = { icon: '🔔', label: 'Obavestenje', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' };

const getMeta = (n) => {
  const t = n.type || n.notificationType;
  if (!t) return fallbackMeta;
  return TYPE_META[t] || TYPE_META[Object.keys(TYPE_META).find((k) => t.toUpperCase().includes(k))] || fallbackMeta;
};

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('ALL');
  const [toast,   setToast]   = useState('');

  const load = () => {
    setLoading(true);
    client.get('/api/notifications/me')
      .then((r) => setNotifs(r.data))
      .catch(() => setError('Greska pri ucitavanju obavestenja.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const markRead = async (id) => {
    try {
      await client.patch(`/api/notifications/${id}/read`).catch(() =>
        client.post(`/api/notifications/${id}/read`)
      );
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      showToast('Greska pri azuriranju.');
    }
  };

  const markAll = async () => {
    try {
      await client.post('/api/notifications/read-all').catch(() =>
        client.patch('/api/notifications/read-all')
      );
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('Sva obavestenja su oznacena kao procitana.');
    } catch {
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('Azurirano lokalno.');
    }
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  const FILTERS = ['ALL', 'UNREAD', 'ALERT', 'APPOINTMENT', 'REMINDER'];
  const FILTER_LABELS = { ALL: 'Sve', UNREAD: `Neprocitano (${unread})`, ALERT: 'Upozorenja', APPOINTMENT: 'Pregledi', REMINDER: 'Podsetnici' };

  const filtered = notifs.filter((n) => {
    if (filter === 'ALL')    return true;
    if (filter === 'UNREAD') return !n.isRead;
    return (n.type || n.notificationType || '').toUpperCase().includes(filter);
  });

  return (
    <div className="layout">
      <Sidebar notifCount={unread} />
      <div className="main-area">
        <div className="page page-narrow">
          <div className="page-head">
            <div>
              <h1 className="page-title">Obavestenja</h1>
              <p className="page-sub">Sva obavestenja, podsetnici i upozorenja.</p>
            </div>
            {unread > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAll}>
                Oznaci sve kao procitano
              </button>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card indigo">
              <div className="stat-icon">🔔</div>
              <div className="stat-num">{notifs.length}</div>
              <div className="stat-label">Ukupno</div>
            </div>
            <div className={`stat-card ${unread > 0 ? 'red' : 'white'}`}>
              <div className="stat-icon">📬</div>
              <div className="stat-num" style={unread === 0 ? { color: 'var(--text)' } : {}}>{unread}</div>
              <div className="stat-label" style={unread === 0 ? { color: 'var(--muted)', opacity: 1 } : {}}>Neprocitano</div>
            </div>
            <div className="stat-card white">
              <div className="stat-icon">📭</div>
              <div className="stat-num" style={{ color: 'var(--text)' }}>{notifs.length - unread}</div>
              <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Procitano</div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">Ucitavanje obavestenja</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔕</div>
              <h3>Nema obavestenja</h3>
              <p>{filter === 'UNREAD' ? 'Sva obavestenja su procitana.' : 'Nema obavestenja u ovoj kategoriji.'}</p>
            </div>
          ) : (
            <div className="notif-list">
              {filtered.map((n) => {
                const meta = getMeta(n);
                return (
                  <div
                    key={n.id}
                    className={`notif-card ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => !n.isRead && markRead(n.id)}
                  >
                    <div className="notif-icon-wrap" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    </div>
                    <div className="notif-body">
                      <div className="notif-top">
                        <span className="notif-type" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
                          {meta.label}
                        </span>
                        <span className="notif-time" title={fmtDate(n.createdAt)}>{fmtRelative(n.createdAt)}</span>
                      </div>
                      <div className="notif-message">{n.message}</div>
                      {!n.isRead && (
                        <button
                          className="notif-read-btn"
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        >
                          Oznaci kao procitano
                        </button>
                      )}
                    </div>
                    {!n.isRead && <div className="notif-dot" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}
