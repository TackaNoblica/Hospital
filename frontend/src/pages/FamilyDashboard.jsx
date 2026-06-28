import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('sr-RS', { day:'2-digit', month:'long', year:'numeric' }); }
  catch { return iso; }
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch { return iso; }
};
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
const fmtDay   = (iso) => iso ? new Date(iso).getDate() : '';
const fmtMon   = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { month: 'short' }) : '';
const isUpcoming = (iso) => iso && new Date(iso) > new Date();
const daysUntil  = (ds)  => {
  if (!ds) return null;
  return Math.ceil((new Date(ds).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
};
const hoursUntil = (iso) => {
  if (!iso) return null;
  return (new Date(iso) - Date.now()) / 3600000;
};

const RISK_META = {
  GREEN:  { label: 'Dobar',   emoji: '🟢', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  YELLOW: { label: 'Paznja',  emoji: '🟡', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  RED:    { label: 'Hitno',   emoji: '🔴', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

const WELLNESS_LBL = { 1: '😩 Veoma loše', 2: '😞 Loše', 3: '😐 Umjereno', 4: '🙂 Dobro', 5: '😊 Odlično' };

const AVATAR_G = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#d946ef'], ['#10b981','#34d399'],
  ['#f97316','#fbbf24'],
];

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [details,     setDetails]     = useState({});
  const [notifCount,  setNotifCount]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    client.get('/api/family-connections/me')
      .then(async (r) => {
        const conns = r.data;
        setConnections(conns);
        if (conns.length > 0) setSelected(conns[0].patient?.id);

        const detailEntries = await Promise.all(
          conns.map(async (c) => {
            const pid = c.patient?.id;
            if (!pid) return [pid, {}];
            const [checkinsRes, apptsRes, planRes] = await Promise.all([
              client.get(`/api/patients/${pid}/checkins`).catch(() => ({ data: [] })),
              client.get(`/api/patients/${pid}/appointments`).catch(() => ({ data: [] })),
              client.get(`/api/patients/${pid}/discharge-plans`).catch(() => ({ data: [] })),
            ]);
            return [pid, {
              checkins: checkinsRes.data,
              appts:    apptsRes.data,
              plan:     planRes.data[0] || null,
            }];
          })
        );
        setDetails(Object.fromEntries(detailEntries));

        const nr = await client.get('/api/notifications/me').catch(() => ({ data: [] }));
        setNotifCount(nr.data.filter((n) => !n.isRead).length);
      })
      .catch(() => setError('Greska pri ucitavanju. Proverite konekciju.'))
      .finally(() => setLoading(false));
  }, []);

  const activeConn  = connections.find((c) => c.patient?.id === selected);
  const patient     = activeConn?.patient;
  const hasConsent  = activeConn?.consentGiven === true;
  const d           = patient ? (details[patient.id] || {}) : {};
  const lastC       = d.checkins?.[0];
  const risk        = lastC ? (lastC.riskLevel || 'GREEN') : null;
  const riskMeta    = risk ? RISK_META[risk] : null;
  const nextAppt    = (d.appts || []).find((a) => isUpcoming(a.appointmentDate));
  const plan        = d.plan;
  const days        = plan ? daysUntil(plan.dischargeDate) : null;
  const apptHours   = nextAppt ? hoursUntil(nextAppt.appointmentDate) : null;
  const apptSoon    = apptHours !== null && apptHours > 0 && apptHours <= 48;

  return (
    <div className="layout">
      <Sidebar notifCount={notifCount} />
      <div className="main-area">
        <div className="page page-narrow">
          <div className="page-head">
            <div>
              <h1 className="page-title">Porodicni pregled</h1>
              <p className="page-sub">Pracenje stanja i informacije o voljenim osobama na oporavku.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>
              {notifCount > 0 ? `🔔 ${notifCount} novo` : '🔔 Obavestenja'}
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}

          {loading ? (
            <div className="loading">Ucitavanje</div>
          ) : connections.length === 0 && !error ? (
            <div className="empty">
              <div className="empty-icon">👨‍👩‍👧</div>
              <h3>Nema porodicnih veza</h3>
              <p>Kontaktirajte vaseg lekara da vam dodeli pristup nalogu pacijenta.</p>
            </div>
          ) : (
            <>
              {/* Patient selector tabs */}
              {connections.length > 1 && (
                <div className="tabs" style={{ marginBottom: 20 }}>
                  {connections.map((c) => {
                    const p = c.patient;
                    if (!p) return null;
                    return (
                      <button
                        key={p.id}
                        className={`tab ${selected === p.id ? 'active' : ''}`}
                        onClick={() => setSelected(p.id)}
                      >
                        {p.user?.firstName} {p.user?.lastName}
                      </button>
                    );
                  })}
                </div>
              )}

              {patient && (
                <>
                  {/* Patient hero */}
                  <div className="family-hero">
                    <div
                      className="family-avatar"
                      style={{ background: `linear-gradient(135deg,${AVATAR_G[patient.id % AVATAR_G.length][0]},${AVATAR_G[patient.id % AVATAR_G.length][1]})` }}
                    >
                      {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
                    </div>
                    <div className="family-hero-info">
                      <h2 className="family-hero-name">{patient.user?.firstName} {patient.user?.lastName}</h2>
                      <p className="family-hero-sub">{patient.hospitalDepartment} · {patient.diagnosis?.length > 50 ? patient.diagnosis.slice(0, 50) + '…' : patient.diagnosis}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="pill pill-indigo">{activeConn?.relation || 'Clan porodice'}</span>
                        {hasConsent && riskMeta && (
                          <span className="pill" style={{ background: riskMeta.bg, color: riskMeta.color, border: `1px solid ${riskMeta.border}` }}>
                            {riskMeta.emoji} {riskMeta.label}
                          </span>
                        )}
                        {!hasConsent && (
                          <span className="pill" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                            🔒 Ogranicen pristup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointment reminder banner — always visible */}
                  {apptSoon && (
                    <div style={{
                      marginBottom: 16, padding: '14px 18px',
                      background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                      border: '1.5px solid #f59e0b', borderRadius: 12,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>📅</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#78350f' }}>
                          Podsetnik: pregled za {apptHours < 24 ? `${Math.round(apptHours)}h` : `${Math.ceil(apptHours / 24)} dana`}!
                        </div>
                        <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>
                          {nextAppt.appointmentType} · {fmtDateTime(nextAppt.appointmentDate)}
                          {nextAppt.location && ` · 📍 ${nextAppt.location}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#78350f', background: '#fcd34d', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                        Ne zaboravite!
                      </div>
                    </div>
                  )}

                  {/* Last checkin — only with consent */}
                  {hasConsent && lastC && (
                    <div className="card card-pad" style={{
                      marginBottom: 20,
                      background: riskMeta ? riskMeta.bg : 'var(--surface)',
                      border: `1px solid ${riskMeta ? riskMeta.border : 'var(--border)'}`,
                    }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, color: riskMeta?.color || 'var(--muted)', marginBottom: 12 }}>
                        Poslednja prijava · {fmtRelative(lastC.createdAt)}
                      </div>
                      <div className="vitals-grid">
                        {lastC.temperature != null && (
                          <div className="vital-cell">
                            <div className="vital-val">{lastC.temperature}°C</div>
                            <div className="vital-label">Temperatura</div>
                          </div>
                        )}
                        {lastC.wellbeingScore != null && (
                          <div className="vital-cell">
                            <div className="vital-val">{lastC.wellbeingScore}<span style={{ fontSize: 14 }}>/5</span></div>
                            <div className="vital-label">Osecanje</div>
                          </div>
                        )}
                        <div className="vital-cell">
                          <div className="vital-val">{d.checkins?.length || 0}</div>
                          <div className="vital-label">Ukupno prijava</div>
                        </div>
                        {plan && days != null && (
                          <div className="vital-cell">
                            <div className="vital-val">{Math.abs(days)}</div>
                            <div className="vital-label">{days > 0 ? 'Dana do otpusta' : 'Dana od otpusta'}</div>
                          </div>
                        )}
                      </div>
                      {lastC.comment && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,.6)', borderRadius: 10, fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>
                          "{lastC.comment}"
                        </div>
                      )}
                      {(() => {
                        const symptoms = [
                          lastC.nausea && 'Mucnina', lastC.bleeding && 'Krvarenje',
                          lastC.breathingProblem && 'Ot. disanje', lastC.woundRedness && 'Crvenilo',
                          lastC.generalWorsening && 'Pogorsanje',
                        ].filter(Boolean);
                        return symptoms.length > 0 ? (
                          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {symptoms.map((s) => (
                              <span key={s} className="pill" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', fontSize: 12 }}>⚠️ {s}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="dashboard-grid">
                    {/* Left col: appointments — ALWAYS visible */}
                    <div>
                      <div className="section-header" style={{ marginBottom: 12 }}>
                        <span className="section-title">Sledeci pregled</span>
                      </div>
                      {nextAppt ? (
                        <div className="card card-pad" style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                              background: 'var(--primary-bg)', border: '1px solid var(--primary-light)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{fmtDay(nextAppt.appointmentDate)}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{fmtMon(nextAppt.appointmentDate)}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{nextAppt.appointmentType}</div>
                              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                                🕐 {fmtDateTime(nextAppt.appointmentDate)}
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                                📍 {nextAppt.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="card card-pad" style={{ marginBottom: 20, textAlign: 'center', color: 'var(--muted)', padding: '24px 16px' }}>
                          <div>📅 Nema zakazanih pregleda</div>
                        </div>
                      )}

                      {(d.appts || []).filter(a => isUpcoming(a.appointmentDate)).length > 1 && (
                        <>
                          <div className="section-header" style={{ marginBottom: 10 }}>
                            <span className="section-title">Predstojecu pregledi</span>
                            <span className="section-count">{d.appts.filter(a => isUpcoming(a.appointmentDate)).length}</span>
                          </div>
                          <div className="card" style={{ marginBottom: 20 }}>
                            {d.appts.filter(a => isUpcoming(a.appointmentDate)).slice(0, 4).map((a, i, arr) => (
                              <div key={a.id} style={{
                                padding: '10px 16px',
                                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.appointmentType}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDateTime(a.appointmentDate)}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right col: medical data — requires consent */}
                    <div>
                      {!hasConsent ? (
                        <div className="card card-pad" style={{
                          textAlign: 'center', padding: '36px 24px',
                          background: '#f8fafc', border: '1.5px dashed #cbd5e1',
                        }}>
                          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#334155', marginBottom: 8 }}>
                            Pristup medicinskim podacima nije odobren
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                            Pacijent nije odobrio uvid u medicinske podatke (vitale, anamnestičke podatke, plan oporavka).
                            <br /><br />
                            Zamolite {patient.user?.firstName} da vam odobri pristup u svojoj aplikaciji pod
                            <strong> Plan oporavka → Porodica</strong>.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="section-header" style={{ marginBottom: 12 }}>
                            <span className="section-title">Plan oporavka</span>
                          </div>
                          {plan ? (
                            <div className="card card-pad" style={{ marginBottom: 20 }}>
                              {days != null && (
                                <div style={{
                                  background: days > 0 ? 'var(--primary-bg)' : '#f0fdf4',
                                  border: `1px solid ${days > 0 ? 'var(--primary-light)' : '#bbf7d0'}`,
                                  borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                                  display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                  <div style={{ fontSize: 28, flexShrink: 0 }}>{days > 0 ? '🏥' : '🏡'}</div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: days > 0 ? 'var(--primary-dark)' : '#065f46' }}>
                                      {days > 0 ? `Otpust za ${days} dana` : days === 0 ? 'Danas je otpust!' : `${Math.abs(days)} dana od otpusta`}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(plan.dischargeDate)}</div>
                                  </div>
                                </div>
                              )}

                              {plan.diagnosisSummary && (
                                <div className="info-block" style={{ marginBottom: 0 }}>
                                  <div className="info-block-label">📋 Dijagnoza</div>
                                  <div className="info-block-text">{plan.diagnosisSummary}</div>
                                </div>
                              )}

                              {plan.warningSigns && (
                                <div className="warning-block" style={{ marginTop: 12, marginBottom: 0 }}>
                                  <div className="info-block-label">⚠️ Znaci upozorenja</div>
                                  <div className="info-block-text">{plan.warningSigns}</div>
                                </div>
                              )}

                              {plan.medications?.length > 0 && (
                                <div style={{ marginTop: 14 }}>
                                  <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: 'var(--muted)', letterSpacing: '.07em', marginBottom: 8 }}>
                                    Terapija ({plan.medications.length} lekova)
                                  </div>
                                  {plan.medications.slice(0, 3).map((m) => (
                                    <div key={m.id} style={{
                                      display: 'flex', gap: 10, alignItems: 'center',
                                      padding: '7px 0', borderBottom: '1px solid var(--border)',
                                    }}>
                                      <span style={{ fontSize: 18 }}>💊</span>
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.medicationName} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{m.dosage}</span></div>
                                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.frequency}</div>
                                      </div>
                                    </div>
                                  ))}
                                  {plan.medications.length > 3 && (
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                                      +{plan.medications.length - 3} jos...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="card card-pad" style={{ marginBottom: 20, textAlign: 'center', color: 'var(--muted)', padding: '24px 16px' }}>
                              <div>📄 Nema plana oporavka</div>
                            </div>
                          )}

                          {/* Recent checkin history */}
                          {d.checkins?.length > 1 && (
                            <>
                              <div className="section-header" style={{ marginBottom: 10 }}>
                                <span className="section-title">Nedavne prijave</span>
                                <span className="section-count">{Math.min(d.checkins.length, 5)}</span>
                              </div>
                              <div className="card card-pad">
                                {d.checkins.slice(0, 5).map((c, i) => {
                                  const rm = RISK_META[c.riskLevel || 'GREEN'];
                                  return (
                                    <div key={c.id} style={{
                                      display: 'flex', gap: 10, alignItems: 'center',
                                      padding: '8px 0', borderBottom: i < Math.min(d.checkins.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                                    }}>
                                      <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: rm.color, flexShrink: 0,
                                      }} />
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: rm.color }}>{rm.label}</span>
                                        {c.temperature != null && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>🌡️ {c.temperature}°C</span>}
                                        {c.wellbeingScore != null && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>{WELLNESS_LBL[c.wellbeingScore] || `${c.wellbeingScore}/5`}</span>}
                                      </div>
                                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtRelative(c.createdAt)}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
