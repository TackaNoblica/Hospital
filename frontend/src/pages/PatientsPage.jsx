import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const AVATAR_G = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#d946ef'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'], ['#f43f5e','#fb923c'],
];

const initials   = (user) => user ? `${user.firstName?.[0]??''}${user.lastName?.[0]??''}`.toUpperCase() : '?';
const avatarGrad = (id)  => AVATAR_G[(id ?? 0) % AVATAR_G.length];

const fmtRelative = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1)  return 'Pre < 1h';
  if (h < 24) return `Pre ${h}h`;
  if (d === 1) return 'Juce';
  return `Pre ${d} dana`;
};

function SparkLine({ values, color = '#6366f1', width = 80, height = 32 }) {
  const nums = (values || []).filter((v) => v != null && !isNaN(v));
  if (nums.length < 2) return <span style={{ color: 'var(--muted-light)', fontSize: 11 }}>—</span>;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 0.1;
  const pad = 3;
  const pts = nums.map((v, i) => {
    const x = pad + (i / (nums.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lx = (pad + (width - pad * 2)).toFixed(1);
  const ly = (pad + (1 - (nums[nums.length - 1] - min) / range) * (height - pad * 2)).toFixed(1);
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}


export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    client.get('/api/patients/doctor')
      .then(async (r) => {
        setPatients(r.data);
        const entries = await Promise.all(
          r.data.map((p) =>
            client.get(`/api/patients/${p.id}/checkins`)
              .then((res) => [p.id, res.data])
              .catch(() => [p.id, []])
          )
        );
        setCheckins(Object.fromEntries(entries));
      })
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const enriched = patients
    .map((p) => ({ ...p, _checkins: checkins[p.id] || [] }));

  const filtered = enriched.filter((p) => {
    const q = search.toLowerCase();
    return `${p.user?.firstName} ${p.user?.lastName}`.toLowerCase().includes(q)
      || (p.diagnosis ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page">
          <div className="page-head">
            <div>
              <h1 className="page-title">Moji pacijenti</h1>
              <p className="page-sub">Pregled svih pacijenata sa trenutnim statusom rizika i vitalnim znacima.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card indigo">
              <div className="stat-icon">👥</div>
              <div className="stat-num">{patients.length}</div>
              <div className="stat-label">Ukupno pacijenata</div>
            </div>
            <div className="stat-card white">
              <div className="stat-icon">📋</div>
              <div className="stat-num">{enriched.filter((p) => p._checkins.length > 0).length}</div>
              <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Sa prijavama</div>
            </div>
            <div className="stat-card white">
              <div className="stat-icon">🫁</div>
              <div className="stat-num">{enriched.filter((p) => p._checkins[0]?.spO2 != null).length}</div>
              <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Sa SpO₂ praćenjem</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">🔍</div>
              <div className="stat-num">{filtered.length}</div>
              <div className="stat-label">Prikazano</div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="search-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
              </svg>
            </span>
            <input
              className="search-input"
              placeholder="Pretrazi po imenu ili dijagnozi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading">Ucitavanje pacijenata</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔎</div>
              <h3>Nema rezultata</h3>
              <p>Pokusajte drugaciji naziv ili promenite filter.</p>
            </div>
          ) : (
            <div className="patients-grid">
              {filtered.map((p) => {
                const lastC = p._checkins?.[0];
                const temps = p._checkins.map((c) => c.temperature).filter(Boolean).reverse();
                const spo2s = p._checkins.map((c) => c.spO2).filter(Boolean).reverse();
                const g     = avatarGrad(p.id);
                const lastSpO2 = lastC?.spO2;
                const spO2Color = lastSpO2 == null ? '#6b7280' : lastSpO2 < 92 ? '#ef4444' : lastSpO2 < 95 ? '#f59e0b' : '#10b981';
                return (
                  <div
                    key={p.id}
                    className="patient-card"
                    onClick={() => navigate(`/patients/${p.id}`, { state: { patient: p } })}
                  >
                    <div className="patient-card-head">
                      <div className="avatar" style={{ background: `linear-gradient(135deg,${g[0]},${g[1]})` }}>
                        {initials(p.user)}
                      </div>
                      <div className="patient-meta">
                        <h3>{p.user?.firstName} {p.user?.lastName}</h3>
                        <p>{p.hospitalDepartment}</p>
                      </div>
                    </div>

                    <div className="patient-card-body">
                      <div className="patient-row">
                        <span className="patient-row-label">Dijagnoza</span>
                        <span className="patient-row-val" style={{ fontSize: 12, textAlign: 'right', maxWidth: 160, color: 'var(--muted)' }}>
                          {p.diagnosis?.length > 36 ? p.diagnosis.slice(0, 36) + '…' : p.diagnosis}
                        </span>
                      </div>
                      {lastC && (
                        <>
                          <div className="patient-row">
                            <span className="patient-row-label">Temperatura</span>
                            <span className="patient-row-val">
                              {lastC.temperature != null ? `${lastC.temperature} °C` : '—'}
                            </span>
                          </div>
                          {lastSpO2 != null && (
                            <div className="patient-row">
                              <span className="patient-row-label">SpO₂</span>
                              <span className="patient-row-val" style={{ color: spO2Color, fontWeight: 600 }}>{lastSpO2}%</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="patient-row">
                        <span className="patient-row-label">Poslednja prijava</span>
                        <span className="patient-row-val">{fmtRelative(lastC?.createdAt)}</span>
                      </div>
                      {temps.length >= 2 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 500 }}>Trend temperature</div>
                          <SparkLine values={temps} color="#6366f1" width={180} height={36} />
                        </div>
                      )}
                      {spo2s.length >= 2 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 500 }}>Trend SpO₂</div>
                          <SparkLine values={spo2s} color={spO2Color} width={180} height={36} />
                        </div>
                      )}
                    </div>

                    <div className="patient-card-foot">
                      <button
                        className="btn btn-primary btn-sm btn-block"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${p.id}`, { state: { patient: p } });
                        }}
                      >
                        Pogledaj detalje →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
