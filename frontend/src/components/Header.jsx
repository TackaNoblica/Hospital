import { NavLink, useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  DOCTOR:        'Lekar',
  PATIENT:       'Pacijent',
  FAMILY:        'Porodica',
  FAMILY_MEMBER: 'Porodica',
  ADMIN:         'Admin',
};

const ROLE_LINKS = {
  DOCTOR: [
    { to: '/dashboard', label: 'Tabla' },
    { to: '/patients',  label: 'Pacijenti' },
  ],
  PATIENT: [
    { to: '/patient', label: 'Prijava simptoma' },
    { to: '/plan',    label: 'Plan oporavka' },
  ],
  FAMILY: [
    { to: '/notifications', label: 'Obavestenja' },
  ],
  FAMILY_MEMBER: [
    { to: '/notifications', label: 'Obavestenja' },
  ],
};

const ALL_LINKS = [
  { to: '/dashboard',     label: 'Tabla' },
  { to: '/patients',      label: 'Pacijenti' },
  { to: '/patient',       label: 'Prijava simptoma' },
  { to: '/plan',          label: 'Plan oporavka' },
  { to: '/notifications', label: 'Obavestenja' },
];

export default function Header() {
  const navigate = useNavigate();
  const role     = localStorage.getItem('careafterRole');
  const links    = ROLE_LINKS[role] ?? ALL_LINKS;

  const logout = () => {
    localStorage.removeItem('careafterToken');
    localStorage.removeItem('careafterRole');
    navigate('/');
  };

  const cls = ({ isActive }) => (isActive ? 'navlink active' : 'navlink');

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">+</span>
        <span className="brand-name">CareAfter</span>
      </div>

      <nav className="topnav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>
        ))}
        {role && (
          <>
            <span className="topnav-sep" />
            <span className="role-badge">{ROLE_LABELS[role] ?? role}</span>
          </>
        )}
        <span className="topnav-sep" />
        <button className="btn btn-ghost btn-sm" onClick={logout}>Odjava</button>
      </nav>
    </header>
  );
}
