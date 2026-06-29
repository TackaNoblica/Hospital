import { useEffect, useState } from 'react';
import client from '../api/client';
import Sidebar from '../components/Sidebar';

const RESULT = {
  GREEN:         { icon: '✅', bg: 'risk-green',  title: 'Nema znakova povećanog rizika',   text: 'Nastavite sa redovnom terapijom i odmorom. Ako se stanje promeni, prijavite ponovo.' },
  GREEN_WORRIED: { icon: '😌', bg: 'risk-green',  title: 'Parametri su uredni — smiri se!', text: 'Vaše izmerene vrednosti (temperatura, SpO₂, disanje) su u normalnom opsegu. Sistem ne detektuje alarmantne znake. Moguće je da ste uznemireni — to je razumljivo, ali sačekajte malo pre nego što pišete lekaru. Ako se stanje promeni, odmah se prijavite ponovo.' },
  YELLOW:        { icon: '⚠️', bg: 'risk-yellow', title: 'Obratite pažnju na simptome',     text: 'Postoje simptomi koji zahtevaju praćenje. Razmislite o kontaktu sa zdravstvenom ustanovom.' },
  RED:           { icon: '🚨', bg: 'risk-red',    title: 'Potrebna hitna provera',           text: 'Vaši simptomi zahtevaju hitno javljanje lekaru ili pozivanje hitne pomoći!' },
};

const DISTRESS_WORDS = ['uzasno', 'uzasav', 'strasno', 'grozno', 'jako lose', 'ne mogu', 'panika', 'strah', 'umiru', 'gasim', 'nista mi ne', 'najgore', 'uzas', 'uzasno', 'uzasavajuce'];

const RISK_COLOR = { GREEN: '#10b981', YELLOW: '#f59e0b', RED: '#ef4444' };
const RISK_LBL   = { GREEN: 'Nizak',   YELLOW: 'Srednji', RED: 'Visok' };

const MMRC = [
  { v: 0, label: 'Samo pri intenzivnom naporu',              color: '#10b981' },
  { v: 1, label: 'Brzim hodom ili hodanjem uzbrdo',          color: '#10b981' },
  { v: 2, label: 'Sporiji hod, moram da stanem', color: '#f59e0b' },
  { v: 3, label: 'Stajem posle ~100m ili par minuta hoda',   color: '#f97316' },
  { v: 4, label: 'Predispnoičan u sobi, teškoće pri oblačenju', color: '#ef4444' },
];

const COUGH_TYPES = [
  { v: 'DRY',        label: 'Suv kasalj',          sub: 'Bez sluzi' },
  { v: 'PRODUCTIVE', label: 'Produktivan (sa sekretom)', sub: 'Sa iskašljajem' },
];

const SPUTUM = [
  { v: 'WHITE',       label: 'Beo / sivkast',      sub: 'Sluz — tipično za astmu/KOPB', color: '#6366f1', bg: '#eef2ff' },
  { v: 'YELLOW_GREEN',label: 'Žuto-zelen',          sub: 'Sugeriše bakterijsku infekciju', color: '#f59e0b', bg: '#fffbeb' },
  { v: 'BLOODY',      label: 'Sa tragovima krvi',   sub: '⚠️ Hemoptiza — potrebna hitna provera', color: '#ef4444', bg: '#fef2f2' },
];


const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('sr-RS', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
  : '';

const WELLBEING = [
  { v: 1, label: 'Veoma loše',  emoji: '😩', color: '#ef4444' },
  { v: 2, label: 'Loše',        emoji: '😞', color: '#f97316' },
  { v: 3, label: 'Umjereno',    emoji: '😐', color: '#f59e0b' },
  { v: 4, label: 'Dobro',       emoji: '🙂', color: '#10b981' },
  { v: 5, label: 'Odlično',     emoji: '😊', color: '#059669' },
];

const EMPTY_FORM = {
  temperature: '', spO2: '', respiratoryRate: '',
  wellbeingScore: null,
  hasCough: false, coughType: '', sputumColor: '', coughIntensity: 5, coughNote: '',
  breathingProblem: false, dyspneaLevel: null, hasWheezing: false,
  hasFatigue: false, hasNightSweats: false,
  generalWorsening: false, nausea: false, bleeding: false,
  comment: '',
  imageData: null,
};

function SectionToggle({ label, icon, active, onToggle, children }) {
  return (
    <div className="dekurzus-section">
      <button
        type="button"
        className={`dekurzus-toggle-btn ${active ? 'on' : ''}`}
        onClick={onToggle}
      >
        <span className="dekurzus-toggle-check">{active ? '✓' : ''}</span>
        <span className="dekurzus-toggle-icon">{icon}</span>
        <span className="dekurzus-toggle-label">{label}</span>
      </button>
      {active && (
        <div className="dekurzus-sub">{children}</div>
      )}
    </div>
  );
}

function RadioRow({ options, value, onChange }) {
  return (
    <div className="dekurzus-radio-row">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.v}
          className={`dekurzus-radio-btn ${value === opt.v ? 'on' : ''}`}
          onClick={() => onChange(opt.v)}
          style={value === opt.v && opt.color ? { borderColor: opt.color, color: opt.color } : undefined}
        >
          {opt.label}
          {opt.sub && <span className="dekurzus-radio-sub">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
}

export default function PatientPage() {
  const [patient,      setPatient]      = useState(null);
  const [recentC,      setRecentC]      = useState([]);
  const [loadErr,      setLoadErr]      = useState('');
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [result,       setResult]       = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const loadData = () => {
    client.get('/api/patients/me')
      .then(async (r) => {
        setPatient(r.data);
        const cr = await client.get('/api/patients/me/checkins').catch(() => ({ data: [] }));
        setRecentC(cr.data.slice(0, 5));
      })
      .catch(() => setLoadErr('Ovaj nalog nema profil pacijenta. Prijavite se kao Pacijent.'));
  };

  useEffect(() => { loadData(); }, []);

  const spO2Val = form.spO2 !== '' ? parseFloat(form.spO2) : null;
  const spO2Color = spO2Val == null ? '#6b7280' : spO2Val < 92 ? '#ef4444' : spO2Val < 95 ? '#f59e0b' : '#10b981';

  const submit = async () => {
    if (!patient) return;
    setSubmitting(true); setResult(null); setLoadErr('');
    try {
      const body = {
        temperature:      form.temperature === '' ? null : parseFloat(form.temperature),
        spO2:             form.spO2 === '' ? null : parseFloat(form.spO2),
        respiratoryRate:  form.respiratoryRate === '' ? null : parseInt(form.respiratoryRate, 10),
        wellbeingScore:   form.wellbeingScore,
        hasCough:         form.hasCough,
        coughType:        form.hasCough ? (form.coughType || null) : null,
        sputumColor:      form.hasCough && form.coughType === 'PRODUCTIVE' ? (form.sputumColor || null) : null,
        coughIntensity:   form.hasCough ? Number(form.coughIntensity) : null,
        coughNote:        form.hasCough ? (form.coughNote || null) : null,
        breathingProblem: form.breathingProblem,
        dyspneaLevel:     form.breathingProblem ? form.dyspneaLevel : null,
        hasWheezing:      form.breathingProblem ? form.hasWheezing : false,
        hasFatigue:       form.hasFatigue,
        hasNightSweats:   form.hasNightSweats,
        generalWorsening: form.generalWorsening,
        nausea:           form.nausea,
        bleeding:         form.bleeding,
        comment:          form.comment || null,
        imageData:        form.imageData || null,
      };
      const r = await client.post(`/api/symptom-checkins/patient/${patient.id}`, body);
      const riskLevel = r.data.riskLevel || 'GREEN';
      const commentLc = (form.comment || '').toLowerCase();
      const isDistressed = DISTRESS_WORDS.some((w) => commentLc.includes(w));
      const displayResult = riskLevel === 'GREEN' && isDistressed ? 'GREEN_WORRIED' : riskLevel;
      setResult(displayResult);
      setForm(EMPTY_FORM);
      setImagePreview(null);
      loadData();
    } catch {
      setLoadErr('Greška pri slanju. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = patient?.user?.firstName;
  const lastC     = recentC[0];
  const coughMap  = { DRY: 'Suv kasalj', PRODUCTIVE: 'Produktivan kasalj' };
  const sputumMap = { WHITE: 'Bel sekret', YELLOW_GREEN: 'Žuto-zelen', BLOODY: 'Hemoptiza' };
  const dyspnMap  = ['U miru okej', 'Brzi hod', 'Sporiji hod / stajanje', 'Stajanje na 100m', 'Predispnoičan u sobi'];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page page-narrow">

          <div className="page-head">
            <div>
              <h1 className="page-title">{firstName ? `Zdravo, ${firstName}` : 'Prijava simptoma'}</h1>
              <p className="page-sub">Popunite dnevnu promenu stanja (dekurzus) za plućnu patologiju.</p>
            </div>
          </div>

          {loadErr && <div className="form-error">{loadErr}</div>}

          {lastC && !result && (
            <div className="card card-pad" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: RISK_COLOR[lastC.riskLevel||'GREEN']+'20', border: `2px solid ${RISK_COLOR[lastC.riskLevel||'GREEN']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {lastC.riskLevel === 'RED' ? '🔴' : lastC.riskLevel === 'YELLOW' ? '🟡' : '🟢'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  Poslednja prijava: <span style={{ color: RISK_COLOR[lastC.riskLevel||'GREEN'] }}>{RISK_LBL[lastC.riskLevel||'GREEN']} rizik</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {fmtDate(lastC.createdAt)}
                  {lastC.temperature != null && ` · ${lastC.temperature}°C`}
                  {lastC.spO2 != null && ` · SpO₂ ${lastC.spO2}%`}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className={`risk-banner ${RESULT[result].bg}`} style={{ marginBottom: 20 }}>
              <span className="risk-icon">{RESULT[result].icon}</span>
              <div><strong>{RESULT[result].title}</strong><p>{RESULT[result].text}</p></div>
            </div>
          )}

          <div className="card card-pad">

            {/* ── Section 1: Vitalni znaci ── */}
            <div className="dekurzus-sec-header">Vitalni znaci</div>

            <div className="two-col" style={{ marginBottom: 0, gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Telesna temperatura (°C)</label>
                <input className="input" type="number" step="0.1" min="34" max="43"
                  value={form.temperature} onChange={(e) => set('temperature', e.target.value)}
                  placeholder="npr. 37.2" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  SpO₂ saturacija kiseonika (%)
                  {spO2Val != null && (
                    <span style={{ fontWeight: 700, color: spO2Color, fontSize: 14 }}>{spO2Val}%</span>
                  )}
                </label>
                <input className="input" type="number" step="0.5" min="70" max="100"
                  value={form.spO2} onChange={(e) => set('spO2', e.target.value)}
                  placeholder="npr. 96"
                  style={{ borderColor: spO2Val != null && spO2Val < 92 ? '#ef4444' : spO2Val != null && spO2Val < 95 ? '#f59e0b' : undefined }} />
                {spO2Val != null && spO2Val < 92 && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠️ Kritično niska saturacija — obavezno kontaktirajte lekara!</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="field">
              <label className="label">Brzina disanja (udisaja/min)</label>
              <input className="input" type="number" min="8" max="60"
                value={form.respiratoryRate} onChange={(e) => set('respiratoryRate', e.target.value)}
                placeholder="npr. 18" />
              {form.respiratoryRate && parseInt(form.respiratoryRate, 10) > 24 && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Ubrzano disanje (tahipneja &gt;24/min)</div>
              )}
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Kako se osećam danas</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {WELLBEING.map(({ v, label, emoji, color }) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => set('wellbeingScore', form.wellbeingScore === v ? null : v)}
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: 10, border: '2px solid',
                      borderColor: form.wellbeingScore === v ? color : 'var(--border)',
                      background: form.wellbeingScore === v ? color + '18' : 'var(--surface)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4, transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: form.wellbeingScore === v ? color : 'var(--muted)' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-divider" />

            {/* ── Section 2: Kasalj ── */}
            <div className="dekurzus-sec-header">Respiratorni simptomi</div>

            <SectionToggle
              label="Kasalj"
              icon="🤧"
              active={form.hasCough}
              onToggle={() => { set('hasCough', !form.hasCough); if (form.hasCough) set('coughType', ''); }}
            >
              <div className="dekurzus-sub-label">Tip kaslja</div>
              <RadioRow options={COUGH_TYPES} value={form.coughType}
                onChange={(v) => { set('coughType', v); if (v !== 'PRODUCTIVE') set('sputumColor', ''); }} />

              {form.coughType === 'PRODUCTIVE' && (
                <>
                  <div className="dekurzus-sub-label" style={{ marginTop: 14 }}>Boja sekreta (iskašljaj)</div>
                  <RadioRow options={SPUTUM} value={form.sputumColor} onChange={(v) => set('sputumColor', v)} />
                </>
              )}

              <div className="dekurzus-sub-label" style={{ marginTop: 14 }}>
                Intenzitet kaslja: <strong>{form.coughIntensity}/10</strong>
              </div>
              <input className="slider" type="range" min="1" max="10" value={form.coughIntensity}
                onChange={(e) => set('coughIntensity', e.target.value)} />
              <div className="slider-scale"><span>Blagi</span><span>Umereni</span><span>Jak, iscrpljujući</span></div>

              <div className="dekurzus-sub-label" style={{ marginTop: 14 }}>Opišite kasalj (opciono)</div>
              <textarea
                placeholder="npr. uglavnom ujutru, suv, bez iskašljavanja..."
                value={form.coughNote}
                onChange={(e) => set('coughNote', e.target.value)}
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                  border: '1.5px solid var(--border)', borderRadius: 10,
                  fontSize: 13.5, resize: 'vertical',
                  background: 'var(--surface)', color: 'var(--text)',
                  marginTop: 4,
                }}
              />
            </SectionToggle>

            {/* ── Section 3: Otežano disanje ── */}
            <SectionToggle
              label="Otežano disanje (dispneja)"
              icon="😮‍💨"
              active={form.breathingProblem}
              onToggle={() => { set('breathingProblem', !form.breathingProblem); if (form.breathingProblem) { set('dyspneaLevel', null); set('hasWheezing', false); } }}
            >
              <div className="dekurzus-sub-label">mMRC skala težine dispneje</div>
              <div className="dekurzus-mmrc-list">
                {MMRC.map(({ v, label, color }) => (
                  <button type="button" key={v}
                    className={`dekurzus-mmrc-btn ${form.dyspneaLevel === v ? 'on' : ''}`}
                    onClick={() => set('dyspneaLevel', v)}
                    style={form.dyspneaLevel === v ? { borderColor: color, background: color + '15', color } : undefined}>
                    <span className="dekurzus-mmrc-grade" style={{ color }}>{v}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <button type="button"
                  className={`dekurzus-toggle-btn small ${form.hasWheezing ? 'on' : ''}`}
                  onClick={() => set('hasWheezing', !form.hasWheezing)}>
                  <span className="dekurzus-toggle-check">{form.hasWheezing ? '✓' : ''}</span>
                  <span>〰️ Zviždanje pri disanju (bronhospazam)</span>
                </button>
              </div>
            </SectionToggle>

            <div className="form-divider" />

            {/* ── Section 5: Ostali simptomi ── */}
            <div className="dekurzus-sec-header">Ostali simptomi</div>
            <div className="toggle-grid">
              {[
                { key: 'hasFatigue',       label: 'Umor / slabost',     icon: '😴' },
                { key: 'hasNightSweats',   label: 'Noćno znojenje',     icon: '💦' },
                { key: 'nausea',           label: 'Mučnina',            icon: '🤢' },
                { key: 'bleeding',         label: 'Krvarenje',          icon: '🩸' },
                { key: 'generalWorsening', label: 'Opšte pogoršanje',   icon: '😔' },
              ].map(({ key, label, icon }) => (
                <button type="button" key={key}
                  className={`toggle-card ${form[key] ? 'on' : ''}`}
                  onClick={() => set(key, !form[key])}>
                  <span className="toggle-check">{form[key] ? '✓' : ''}</span>
                  <span>{icon} {label}</span>
                </button>
              ))}
            </div>

            <div className="form-divider" />

            <div className="field">
              <label className="label">Komentar (opciono)</label>
              <textarea className="input textarea" rows="3" value={form.comment}
                onChange={(e) => set('comment', e.target.value)}
                placeholder="Napišite kako se osećate ili šta vas brine..." />
            </div>

            {/* ── Image upload ── */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Fotografija simptoma (opciono)</label>
              <div style={{ marginTop: 6 }}>
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, border: '2px solid var(--border)', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => { set('imageData', null); setImagePreview(null); }}
                      style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 16px', border: '2px dashed var(--border)', borderRadius: 10, cursor: 'pointer', background: 'var(--surface-2)', transition: 'border-color .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ fontSize: 28 }}>📸</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Priložite sliku simptoma (osip, rana...)</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>JPG, PNG — max 2MB</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { alert('Slika je prevelika — maksimum 2MB.'); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          set('imageData', ev.target.result);
                          setImagePreview(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={submit} disabled={submitting || !patient} style={{ marginTop: 20 }}>
              {submitting ? 'Slanje...' : 'Pošalji promenu stanja'}
            </button>
          </div>

          {/* Recent history */}
          {recentC.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div className="section-header">
                <span className="section-title">Moje nedavne prijave</span>
                <span className="section-count">{recentC.length}</span>
              </div>
              <div className="card card-pad">
                <div className="checkin-list">
                  {recentC.map((c, i) => {
                    const r   = c.riskLevel || 'GREEN';
                    const cls = r.toLowerCase();
                    return (
                      <div key={c.id} className="checkin-item">
                        <div className="checkin-dot-col">
                          <span className={`checkin-dot ${cls}`} />
                          {i < recentC.length - 1 && <span className="checkin-line" />}
                        </div>
                        <div className="checkin-content">
                          <div className="checkin-top">
                            <span className={`pill pill-${cls}`}>{RISK_LBL[r]} rizik</span>
                            <span className="checkin-date">{fmtDate(c.createdAt)}</span>
                          </div>
                          <div className="checkin-vals">
                            {c.temperature != null && <span className="checkin-val">🌡️ {c.temperature}°C</span>}
                            {c.spO2 != null && <span className="checkin-val" style={{ color: c.spO2 < 92 ? '#ef4444' : c.spO2 < 95 ? '#f59e0b' : undefined }}>O₂ {c.spO2}%</span>}
                            {c.respiratoryRate != null && <span className="checkin-val">💨 {c.respiratoryRate}/min</span>}
                            {c.hasCough && <span className="checkin-val">🤧 {coughMap[c.coughType]||'Kasalj'}{c.sputumColor && ` — ${sputumMap[c.sputumColor]}`}{c.coughNote ? ` — "${c.coughNote}"` : ''}</span>}
                            {c.dyspneaLevel != null && <span className="checkin-val">🫁 mMRC {c.dyspneaLevel}: {dyspnMap[c.dyspneaLevel]}</span>}
                            {c.hasWheezing && <span className="checkin-val">〰️ Zviždanje</span>}
                            {c.wellbeingScore != null && <span className="checkin-val">{['','😩','😞','😐','🙂','😊'][c.wellbeingScore]} {c.wellbeingScore}/5</span>}
                          </div>
                          {c.comment && <div className="checkin-comment">"{c.comment}"</div>}
                          {c.imageData && (
                            <img src={c.imageData} alt="symptom" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, marginTop: 4, objectFit: 'cover', border: '1px solid var(--border)', cursor: 'pointer' }}
                              onClick={() => window.open(c.imageData, '_blank')} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
