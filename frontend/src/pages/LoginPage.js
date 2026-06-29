import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const DEMO = [
  { label: 'Lekar',     sub: 'DOCTOR',             email: 'doctor@careafter.local',   password: 'doctor123',   go: '/dashboard'  },
  { label: 'Pacijent',  sub: 'PATIENT',             email: 'patient@careafter.local',  password: 'patient123',  go: '/patient'    },
  { label: 'Porodica',  sub: 'FAMILY_MEMBER',       email: 'family@careafter.local',   password: 'family123',   go: '/family'     },
  { label: 'Ustanova',  sub: 'HEALTH_INSTITUTION',  email: 'hospital@careafter.local', password: 'hospital123', go: '/institution'},
];

const roleFromJwt = (token) => {
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    return p.role || p.roles?.[0] || null;
  } catch { return null; }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const ROLE_HOME = { DOCTOR: '/dashboard', PATIENT: '/patient', FAMILY_MEMBER: '/family', FAMILY: '/family', HEALTH_INSTITUTION: '/institution' };

  const doLogin = async (mail, pass) => {
    setError(''); setLoading(true);
    try {
      const res  = await client.post('/api/auth/login', { email: mail, password: pass });
      const tok  = res.data.token;
      const role = res.data.role || roleFromJwt(tok) || 'PATIENT';
      localStorage.setItem('careafterToken', tok);
      localStorage.setItem('careafterRole',  role);
      if (res.data.firstName || res.data.lastName) {
        localStorage.setItem('careafterName', `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim());
      }
      navigate(ROLE_HOME[role] || '/dashboard');
    } catch {
      setError('Pogresan email ili lozinka. Proverite podatke i pokusajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  return (
    <div className="auth-screen">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="logo-mark" style={{ width: 52, height: 52, fontSize: 26, borderRadius: 16 }}>
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <rect x="5" y="10" width="18" height="16" rx="1.5" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.4"/>
              <rect x="2" y="14" width="5" height="12" rx="1" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1.2"/>
              <rect x="21" y="14" width="5" height="12" rx="1" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1.2"/>
              <rect x="12" y="3" width="4" height="10" rx="1.2" fill="white"/>
              <rect x="9" y="6" width="10" height="4" rx="1.2" fill="white"/>
              <rect x="11.5" y="19" width="5" height="7" rx="0.8" fill="white" fillOpacity="0.5" stroke="white" strokeWidth="1"/>
              <rect x="7" y="14" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6"/>
              <rect x="7" y="18" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6"/>
              <rect x="18" y="14" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6"/>
              <rect x="18" y="18" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <div>
            <div className="logo-name" style={{ fontSize: 26 }}>CareAfter</div>
            <div className="logo-tagline" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>Digitalni zdravstveni portal</div>
          </div>
        </div>

        <div className="auth-badge">
          <span className="auth-badge-dot" />
          Digitalna zdravstvena platforma
        </div>

        <h1 className="auth-tagline">
          Pratite zdravstveno<br />
          stanje pacijenta —<br />
          <em>sve na jednom mestu</em>
        </h1>
        <p className="auth-desc">
          Lekari, pacijenti i porodica povezani u jednom sistemu.
          Vitali, terapija, pregledi i komunikacija — u realnom vremenu.
        </p>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">🫁</div>
            <div>
              <div className="auth-feature-title">Vitalni znaci i SpO₂</div>
              <div className="auth-feature-sub">Dnevno pracenje sa automatskim alarmima</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">💊</div>
            <div>
              <div className="auth-feature-title">Terapija i adherence</div>
              <div className="auth-feature-sub">Digitalni raspored i pracenje uzimanja lekova</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">👨‍👩‍👧</div>
            <div>
              <div className="auth-feature-title">Porodicni pregled</div>
              <div className="auth-feature-sub">Podsetnici za preglede, uvid uz saglasnost</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">💬</div>
            <div>
              <div className="auth-feature-title">Direktna komunikacija</div>
              <div className="auth-feature-sub">Chat sa lekarom, grupne konsultacije</div>
            </div>
          </div>
        </div>

        <div className="auth-stats">
          <div className="auth-stat-item">
            <div className="auth-stat-num">24/7</div>
            <div className="auth-stat-label">Dostupnost</div>
          </div>
          <div className="auth-stat-divider" />
          <div className="auth-stat-item">
            <div className="auth-stat-num">98%</div>
            <div className="auth-stat-label">Redovnost prijava</div>
          </div>
          <div className="auth-stat-divider" />
          <div className="auth-stat-item">
            <div className="auth-stat-num">3 role</div>
            <div className="auth-stat-label">Lekar · Pacijent · Porodica</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-right-head">
            <h2>Dobrodosli</h2>
            <p>Prijavite se da biste pristupili sistemu pracenja oporavka.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Email adresa</label>
              <input
                className="input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@primer.com" required autoFocus
              />
            </div>
            <div className="field">
              <label className="label">Lozinka</label>
              <input
                className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesite lozinku" required
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>

          <div className="divider"><span>ili koristite demo pristup</span></div>

          <div className="demo-row">
            {DEMO.map((a) => (
              <button
                key={a.sub} disabled={loading}
                className="btn btn-ghost demo-btn"
                onClick={() => doLogin(a.email, a.password, a.sub, a.go)}
              >
                {a.label}
                <span className="demo-role">{a.sub === 'FAMILY_MEMBER' ? 'FAMILY' : a.sub}</span>
              </button>
            ))}
          </div>

          <p style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: 'var(--muted-light)' }}>
            Demo sistem — podaci su fiktivni i sluze samo za prikaz
          </p>
        </div>
      </div>
    </div>
  );
}
