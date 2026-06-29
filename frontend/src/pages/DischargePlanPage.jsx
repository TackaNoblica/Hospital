import { useEffect, useState } from 'react';
import axios from 'axios';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const BASE = 'http://localhost:8081';
const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem('careafterToken')}` });

const fmtLocal = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('sr-RS', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
};
const fmtDay  = (iso) => iso ? new Date(iso).getDate() : '';
const fmtMon  = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { month: 'short' }) : '';
const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
};

const isUpcoming = (iso) => iso && new Date(iso) > new Date();

export default function DischargePlanPage() {
  const [patient,  setPatient]  = useState(null);
  const [plan,     setPlan]     = useState(null);
  const [appts,    setAppts]    = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('plan');
  const [todayMeds,      setTodayMeds]      = useState([]);
  const [medsLoading,    setMedsLoading]    = useState(false);
  const [takingId,       setTakingId]       = useState(null);
  const [family,         setFamily]         = useState([]);
  const [familyLoading,  setFamilyLoading]  = useState(false);
  const [familyLoaded,   setFamilyLoaded]   = useState(false);
  const [togglingId,     setTogglingId]     = useState(null);

  useEffect(() => {
    client.get('/api/patients/me')
      .then(async (r) => {
        const p = r.data;
        setPatient(p);
        const [plansRes, apptsRes, checkinsRes] = await Promise.all([
          client.get(`/api/patients/${p.id}/discharge-plans`),
          client.get(`/api/patients/${p.id}/appointments`),
          client.get('/api/patients/me/checkins'),
        ]);
        setPlan(plansRes.data[0] || null);
        setAppts(apptsRes.data.slice().sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
        setCheckins(checkinsRes.data);
      })
      .catch(() => setError('Ovaj nalog nema profil pacijenta. Prijavite se kao Pacijent.'))
      .finally(() => setLoading(false));
  }, []);

  const loadTodayMeds = () => {
    setMedsLoading(true);
    axios.get(`${BASE}/api/medications/today`, { headers: authHdr() })
      .then((r) => setTodayMeds(r.data))
      .catch(() => {})
      .finally(() => setMedsLoading(false));
  };

  const loadFamily = () => {
    if (familyLoaded) return;
    setFamilyLoading(true);
    axios.get(`${BASE}/api/family-connections/my-family`, { headers: authHdr() })
      .then((r) => { setFamily(r.data); setFamilyLoaded(true); })
      .catch(() => {})
      .finally(() => setFamilyLoading(false));
  };

  const toggleConsent = async (conn) => {
    setTogglingId(conn.id);
    try {
      const res = await axios.patch(
        `${BASE}/api/family-connections/${conn.id}/consent`,
        { consentGiven: !conn.consentGiven },
        { headers: authHdr() }
      );
      setFamily((prev) => prev.map((c) => c.id === conn.id ? res.data : c));
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const takeMed = async (medicationId) => {
    setTakingId(medicationId);
    try {
      await axios.post(`${BASE}/api/medications/${medicationId}/take`, {}, { headers: authHdr() });
      setTodayMeds((prev) => prev.map((m) => m.medicationId === medicationId ? { ...m, taken: true, takenAt: new Date().toISOString() } : m));
    } catch { /* ignore */ }
    finally { setTakingId(null); }
  };

  const days = plan ? daysUntil(plan.dischargeDate) : null;
  const totalDaysRecovery = plan ? Math.max(1, Math.abs(days ?? 0) + 30) : 1;
  const recoveryProgress = plan ? Math.min(100, Math.round((Math.abs(Math.min(0, days ?? 0)) / totalDaysRecovery) * 100)) : 0;

  const firstName  = patient?.user?.firstName;
  const upcomingAppts = appts.filter((a) => isUpcoming(a.appointmentDate) && a.status !== 'CANCELLED');
  const pastAppts     = appts.filter((a) => !isUpcoming(a.appointmentDate) || a.status === 'CANCELLED');
  const nextAppt   = upcomingAppts[0] ?? null;
  const daysToNextAppt = nextAppt ? daysUntil(nextAppt.appointmentDate) : null;
  const alreadyDischarged = days != null && days <= 0;

  const loadAppts = () =>
    client.get('/api/patients/me/appointments')
      .then((r) => setAppts(r.data.slice().sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))))
      .catch(() => {});

  const cancelAppt = async (apptId) => {
    if (!window.confirm('Otkazati ovaj pregled?')) return;
    await client.patch(`/api/appointments/${apptId}/cancel`).catch(() => {});
    loadAppts();
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page page-narrow">
          <div className="page-head">
            <div>
              <h1 className="page-title">{firstName ? `Plan oporavka — ${firstName}` : 'Plan oporavka'}</h1>
              <p className="page-sub">Uputstvo za oporavak, terapija i zakazani pregledi.</p>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          {loading ? (
            <div className="loading">Ucitavanje plana</div>
          ) : !plan && !error ? (
            <div className="empty">
              <div className="empty-icon">📄</div>
              <h3>Nema plana oporavka</h3>
              <p>Vas lekar jos nije kreirao plan oporavka.</p>
            </div>
          ) : plan && (
            <>
              {/* Plan header */}
              <div className="plan-header">
                <div className="plan-header-icon">{alreadyDischarged ? '📅' : '🏥'}</div>
                <div style={{ flex: 1 }}>
                  <div className="plan-header-title">
                    {alreadyDischarged
                      ? (nextAppt ? `Podsetnik: ${nextAppt.appointmentType}` : 'Plan oporavka aktivan')
                      : days === 0 ? 'Otpust danas!' : `Otpust za ${days} dana`}
                  </div>
                  <div className="plan-header-sub">
                    {alreadyDischarged && nextAppt
                      ? `${fmtTime(nextAppt.appointmentDate)} · ${nextAppt.location}`
                      : fmtLocal(plan.dischargeDate)}
                  </div>

                  {alreadyDischarged && (
                    <div className="progress-wrap">
                      <div className="progress-meta">
                        <span>Oporavak u toku</span>
                        <span>{recoveryProgress}% zavrseno</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${recoveryProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="plan-days-badge">
                  <div className="plan-days-num">
                    {alreadyDischarged && daysToNextAppt != null ? daysToNextAppt : Math.abs(days ?? 0)}
                  </div>
                  <div className="plan-days-label">
                    {alreadyDischarged && daysToNextAppt != null ? 'dana do\nkontrole' : (days > 0 ? 'dana do' : 'dana posle')}<br/>
                    {alreadyDischarged && daysToNextAppt != null ? '' : 'otpusta'}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card white">
                  <div className="stat-icon">💊</div>
                  <div className="stat-num" style={{ color: 'var(--text)' }}>{plan.medications?.length || 0}</div>
                  <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Lekova u terapiji</div>
                </div>
                <div className="stat-card white">
                  <div className="stat-icon">📅</div>
                  <div className="stat-num" style={{ color: 'var(--text)' }}>{upcomingAppts.length}</div>
                  <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Predstojecih pregleda</div>
                </div>
                <div className="stat-card white">
                  <div className="stat-icon">📋</div>
                  <div className="stat-num" style={{ color: 'var(--text)' }}>{checkins.length}</div>
                  <div className="stat-label" style={{ color: 'var(--muted)', opacity: 1 }}>Dnevnih prijava</div>
                </div>
              </div>

              {/* Next appointment callout */}
              {nextAppt && (
                <div style={{
                  background: 'var(--primary-bg)', border: '1px solid var(--primary-light)',
                  borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'white', border: '1px solid var(--primary-light)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{fmtDay(nextAppt.appointmentDate)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{fmtMon(nextAppt.appointmentDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-dark)' }}>Sledeci pregled: {nextAppt.appointmentType}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {fmtTime(nextAppt.appointmentDate)} · {nextAppt.location}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="tabs">
                <button className={`tab ${tab === 'plan'    ? 'active' : ''}`} onClick={() => setTab('plan')}>Plan</button>
                <button className={`tab ${tab === 'today'   ? 'active' : ''}`} onClick={() => { setTab('today'); loadTodayMeds(); }}>
                  💊 Danas
                </button>
                <button className={`tab ${tab === 'meds'    ? 'active' : ''}`} onClick={() => setTab('meds')}>Terapija ({plan.medications?.length || 0})</button>
                <button className={`tab ${tab === 'appts'   ? 'active' : ''}`} onClick={() => setTab('appts')}>Pregledi ({appts.length})</button>
                <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Istorija ({checkins.length})</button>
                <button className={`tab ${tab === 'family'  ? 'active' : ''}`} onClick={() => { setTab('family'); loadFamily(); }}>👨‍👩‍👧 Porodica</button>
              </div>

              {/* Plan tab */}
              {tab === 'plan' && (
                <div>
                  <div className="info-block">
                    <div className="info-block-label">📋 Dijagnoza</div>
                    <div className="info-block-text">{plan.diagnosisSummary}</div>
                  </div>
                  <div className="info-block">
                    <div className="info-block-label">✅ Uputstvo za oporavak</div>
                    <div className="info-block-text">{plan.recoveryInstructions}</div>
                  </div>
                  <div className="warning-block">
                    <div className="info-block-label">⚠️ Kada odmah kontaktirati lekara</div>
                    <div className="info-block-text">{plan.warningSigns}</div>
                  </div>
                </div>
              )}

              {/* Today's medications tab */}
              {tab === 'today' && (
                medsLoading ? (
                  <div className="loading">Ucitavanje lekova za danas...</div>
                ) : todayMeds.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">💊</div>
                    <h3>Nema lekova za danas</h3>
                    <p>Vas lekar nije propisao lekove ili jos nema plana oporavka.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Lekovi za danas</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                          {todayMeds.filter((m) => m.taken).length} / {todayMeds.length} uzeto
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 120, height: 8, borderRadius: 8, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 8, transition: 'width .4s',
                            background: todayMeds.every((m) => m.taken) ? '#10b981' : 'var(--primary)',
                            width: `${Math.round((todayMeds.filter((m) => m.taken).length / todayMeds.length) * 100)}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                          {Math.round((todayMeds.filter((m) => m.taken).length / todayMeds.length) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {todayMeds.map((m) => (
                        <div key={m.medicationId} className="card" style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                          borderLeft: `4px solid ${m.taken ? '#10b981' : 'var(--primary)'}`,
                          opacity: m.taken ? 0.75 : 1,
                        }}>
                          <div style={{ fontSize: 28, flexShrink: 0 }}>{m.taken ? '✅' : '💊'}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.medicationName}</div>
                            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                              {m.dosage} · {m.frequency}
                              {m.instructions && ` · ${m.instructions}`}
                            </div>
                            {m.taken && m.takenAt && (
                              <div style={{ fontSize: 12, color: '#10b981', marginTop: 3, fontWeight: 600 }}>
                                ✓ Uzeto u {new Date(m.takenAt).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                          {!m.taken && (
                            <button
                              onClick={() => takeMed(m.medicationId)}
                              disabled={takingId === m.medicationId}
                              className="btn btn-primary"
                              style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                            >
                              {takingId === m.medicationId ? '...' : 'Uzeo/la sam'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {todayMeds.every((m) => m.taken) && (
                      <div style={{
                        marginTop: 20, padding: '16px 20px', borderRadius: 'var(--radius)',
                        background: '#d1fae5', border: '1px solid #a7f3d0', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                        <div style={{ fontWeight: 700, color: '#065f46', fontSize: 15 }}>Uzeli ste sve lekove za danas!</div>
                        <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>Nastavite redovno — vaš lekar to može da prati.</div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Medications tab */}
              {tab === 'meds' && (
                !plan.medications?.length ? (
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
                        {m.instructions && <div className="med-instructions">{m.instructions}</div>}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Appointments tab */}
              {tab === 'appts' && (
                appts.length === 0 ? (
                  <div className="empty"><div className="empty-icon">📅</div><h3>Nema zakazanih pregleda</h3></div>
                ) : (
                  <>
                    {upcomingAppts.length > 0 && (
                      <>
                        <div className="section-header" style={{ marginBottom: 12 }}><span className="section-title">Predstojecu</span></div>
                        <div className="appt-list" style={{ marginBottom: 24 }}>
                          {upcomingAppts.map((a) => (
                            <div key={a.id} className="appt-card upcoming">
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
                              <button onClick={() => cancelAppt(a.id)}
                                style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, alignSelf: 'center' }}>
                                Otkaži
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {pastAppts.length > 0 && (
                      <>
                        <div className="section-header" style={{ marginBottom: 12 }}><span className="section-title" style={{ color: 'var(--muted)' }}>Prosli pregledi</span></div>
                        <div className="appt-list">
                          {pastAppts.slice().reverse().map((a) => (
                            <div key={a.id} className="appt-card past">
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
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )
              )}

              {/* Family consent tab */}
              {tab === 'family' && (
                familyLoading ? (
                  <div className="loading">Ucitavanje...</div>
                ) : family.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">👨‍👩‍👧</div>
                    <h3>Nema porodicnih veza</h3>
                    <p>Vas lekar dodeljuje pristup clanovima porodice. Kontaktirajte lekara.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--primary-bg)', border: '1px solid var(--primary-light)', borderRadius: 12, fontSize: 13, color: 'var(--primary-dark)', lineHeight: 1.6 }}>
                      ℹ️ Mozete kontrolisati koji clanovi porodice mogu da vide vase medicinske podatke (vitale, anamnestičke podatke, plan oporavka). Pregledi su uvek vidljivi svim clanovima porodice.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {family.map((conn) => (
                        <div key={conn.id} className="card" style={{
                          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                          borderLeft: `4px solid ${conn.consentGiven ? '#10b981' : '#cbd5e1'}`,
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            background: conn.consentGiven ? 'linear-gradient(135deg,#10b981,#34d399)' : 'linear-gradient(135deg,#94a3b8,#cbd5e1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, color: 'white',
                          }}>
                            {conn.familyMember?.firstName?.[0] || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {conn.familyMember?.firstName} {conn.familyMember?.lastName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                              {conn.relation || 'Clan porodice'} · {conn.familyMember?.email}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: conn.consentGiven ? '#10b981' : '#64748b' }}>
                              {conn.consentGiven ? '✅ Ima pristup medicinskim podacima' : '🔒 Nema pristup medicinskim podacima'}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleConsent(conn)}
                            disabled={togglingId === conn.id}
                            className={`btn ${conn.consentGiven ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                            style={{ flexShrink: 0, fontSize: 13 }}
                          >
                            {togglingId === conn.id ? '...' : conn.consentGiven ? '🔒 Oduzmi pristup' : '🔓 Odobri pristup'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* History tab */}
              {tab === 'history' && (
                checkins.length === 0 ? (
                  <div className="empty"><div className="empty-icon">📝</div><h3>Nema istorije prijava</h3></div>
                ) : (
                  <div className="card card-pad">
                    <div className="checkin-list">
                      {checkins.map((c, i) => {
                        const symptoms = [
                          c.breathingProblem && 'Ot. disanje',
                          c.generalWorsening && 'Opste pogorsanje',
                          c.hasWheezing && 'Zvizdanje',
                          c.hasFatigue && 'Umor',
                        ].filter(Boolean);
                        const WEMOJI = ['','😩','😞','😐','🙂','😊'];
                        return (
                          <div key={c.id} className="checkin-item">
                            <div className="checkin-dot-col">
                              <span className="checkin-dot green" />
                              {i < checkins.length - 1 && <span className="checkin-line" />}
                            </div>
                            <div className="checkin-content">
                              <div className="checkin-top">
                                <span className="checkin-date">{fmtDate(c.createdAt)}</span>
                              </div>
                              <div className="checkin-vals">
                                {c.temperature != null && <span className="checkin-val">🌡️ {c.temperature}°C</span>}
                                {c.spO2 != null && <span className="checkin-val" style={{ color: c.spO2 < 92 ? '#ef4444' : c.spO2 < 95 ? '#f59e0b' : undefined }}>O₂ {c.spO2}%</span>}
                                {c.wellbeingScore != null && <span className="checkin-val">{WEMOJI[c.wellbeingScore]} {c.wellbeingScore}/5</span>}
                                {symptoms.length > 0 && <span className="checkin-val">⚠️ {symptoms.join(', ')}</span>}
                              </div>
                              {c.comment && <div className="checkin-comment">"{c.comment}"</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
