import { NavLink, useNavigate } from 'react-router-dom';

const Ico = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="6" r="3"/>
      <path d="M2 18c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
      <path d="M15 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
      <path d="M18 18c0-2.21-1.343-4-3-4"/>
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="3"/>
      <path d="M1 18c0-3.314 2.686-6 6-6"/>
      <circle cx="15" cy="9" r="3"/>
      <path d="M12 15v4M10 17h4"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10c0 4.418-3.582 8-8 8a8.003 8.003 0 01-3.888-1L2 18l1-4.112A7.953 7.953 0 012 10c0-4.418 3.582-8 8-8s8 3.582 8 8z"/>
      <path d="M6 10h.01M10 10h.01M14 10h.01"/>
    </svg>
  ),
  doctors: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3.5"/>
      <path d="M3 18.5c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
      <path d="M10 12v3M8.5 13.5h3"/>
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V8"/>
      <path d="M9 2l5 6H9V2z"/>
      <path d="M6.5 12.5l2 2 3-3.5"/>
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
      <path d="M8 2v4M12 2v4M4 9h12"/>
      <path d="M7 12h2M7 15h5"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a6 6 0 00-6 6v2.5l-1.5 2.5h15L16 10.5V8a6 6 0 00-6-6z"/>
      <path d="M8.5 17a1.5 1.5 0 003 0"/>
    </svg>
  ),
  family: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
      <circle cx="10" cy="8" r="3"/>
      <path d="M14.5 5a2 2 0 110 4"/>
      <path d="M17 18v-1.5a3 3 0 00-2-2.8"/>
    </svg>
  ),
  health: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3C6.134 3 3 6.134 3 10s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"/>
      <path d="M7 10h6M10 7v6"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
      <path d="M13 13l4-3-4-3M7 10h10"/>
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="14" height="10" rx="3"/>
      <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M8 7V5a2 2 0 014 0v2"/>
      <path d="M10 3v1"/>
    </svg>
  ),
};

const ROLE_ROUTES = {
  HEALTH_INSTITUTION: [
    { to: '/institution',    label: 'Kontrolna tabla', icon: Ico.dashboard                       },
    { to: '/notifications',  label: 'Obavestenja',     icon: Ico.bell, badge: 'notifCount'       },
  ],
  DOCTOR: [
    { to: '/dashboard',        label: 'Tabla',           icon: Ico.dashboard, badge: 'alertCount'   },
    { to: '/patients',         label: 'Pacijenti',        icon: Ico.patients                        },
    { to: '/doctor-requests',  label: 'Zahtevi',          icon: Ico.requests,  badge: 'requestCount' },
    { to: '/chat',             label: 'Poruke',           icon: Ico.chat,      badge: 'chatCount'    },
    { to: '/notifications',    label: 'Obavestenja',      icon: Ico.bell,      badge: 'notifCount'   },
    { to: '/dr-megi',          label: 'Dr. Megi',         icon: Ico.bot                              },
  ],
  PATIENT: [
    { to: '/health',           label: 'Zdravstveni karton', icon: Ico.health  },
    { to: '/patient',          label: 'Prijava simptoma', icon: Ico.checkin   },
    { to: '/plan',             label: 'Plan oporavka',    icon: Ico.plan      },
    { to: '/my-doctors',       label: 'Moji lekari',      icon: Ico.doctors   },
    { to: '/chat',             label: 'Poruke',           icon: Ico.chat,      badge: 'chatCount'    },
    { to: '/notifications',    label: 'Obavestenja',      icon: Ico.bell,      badge: 'notifCount'   },
    { to: '/dr-megi',          label: 'Dr. Megi',         icon: Ico.bot                              },
  ],
  FAMILY_MEMBER: [
    { to: '/family',           label: 'Pregled pacijenta', icon: Ico.family  },
    { to: '/notifications',    label: 'Obavestenja',       icon: Ico.bell, badge: 'notifCount' },
    { to: '/dr-megi',          label: 'Dr. Megi',          icon: Ico.bot                       },
  ],
  FAMILY: [
    { to: '/family',           label: 'Pregled pacijenta', icon: Ico.family  },
    { to: '/notifications',    label: 'Obavestenja',       icon: Ico.bell, badge: 'notifCount' },
    { to: '/dr-megi',          label: 'Dr. Megi',          icon: Ico.bot                       },
  ],
};

const ROLE_LABEL = {
  DOCTOR: 'Lekar — Internista',
  PATIENT: 'Pacijent',
  FAMILY_MEMBER: 'Clan porodice',
  FAMILY: 'Clan porodice',
  ADMIN: 'Administrator',
  HEALTH_INSTITUTION: 'Zdravstvena ustanova',
};

function getInitials(name) {
  if (!name) return 'U';
  return name.split(/\s+/).map((w) => w[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
}

export default function Sidebar({
  alertCount   = 0,
  notifCount   = 0,
  requestCount = 0,
  chatCount    = 0,
}) {
  const navigate = useNavigate();
  const role  = localStorage.getItem('careafterRole') || '';
  const token = localStorage.getItem('careafterToken') || '';
  const links = ROLE_ROUTES[role] || [];

  const counts = { alertCount, notifCount, requestCount, chatCount };

  const storedName = localStorage.getItem('careafterName') || '';
  const name       = storedName || 'Korisnik';
  const initials   = getInitials(storedName);
  const roleLabel  = ROLE_LABEL[role] || role;

  const logout = () => {
    localStorage.removeItem('careafterToken');
    localStorage.removeItem('careafterRole');
    localStorage.removeItem('careafterName');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <img src="/logo.png" alt="CareAfter logo" width="36" height="36" style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <div className="logo-name">CareAfter</div>
          <div className="logo-tagline">Zdravstveni portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigacija</div>
        {links.map((link) => {
          const badgeVal = link.badge ? counts[link.badge] : 0;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {link.icon}
              {link.label}
              {badgeVal > 0 && (
                <span className="sidebar-badge">{badgeVal}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name" style={{ textTransform: 'capitalize' }}>{name}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          {Ico.logout}
          Odjava
        </button>
      </div>
    </aside>
  );
}
