import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: <IconGrid /> },
  { path: '/profile',   label: 'Profile',   icon: <IconUser /> },
  { path: '/tailor',    label: 'Tailor',    icon: <IconWand /> },
  { path: '/versions',  label: 'Versions',  icon: <IconClock /> },
]

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <>
      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar" style={s.sidebar}>
        <Link to="/dashboard" style={s.brand}>
          <div style={s.logoMark}>
            <LogoMark />
          </div>
          <span style={s.brandName}>Resume Tailor</span>
        </Link>

        <nav style={s.nav}>
          {NAV_LINKS.map(({ path, label, icon }) => {
            const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                style={{ ...s.link, ...(active ? s.linkActive : {}) }}
              >
                <span style={{ ...s.linkIcon, ...(active ? s.linkIconActive : {}) }}>
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={s.footer}>
          <span style={s.localBadge}>
            <span style={s.localDot} />
            Local mode
          </span>
        </div>
      </aside>

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className="bottom-nav" style={s.bottomNav}>
        {NAV_LINKS.map(({ path, label, icon }) => {
          const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
          return (
            <Link key={path} to={path} style={{ ...s.bottomTab, ...(active ? s.bottomTabActive : {}) }}>
              <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-3)' }}>{icon}</span>
              <span style={s.bottomTabLabel}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

/* ── SVG icons ───────────────────────────────────────────────────────────── */
function SvgIcon({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function IconGrid() {
  return (
    <SvgIcon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </SvgIcon>
  )
}

function IconUser() {
  return (
    <SvgIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </SvgIcon>
  )
}

function IconWand() {
  return (
    <SvgIcon>
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13" />
      <path d="M3 21l9-9" />
    </SvgIcon>
  )
}

function IconClock() {
  return (
    <SvgIcon>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </SvgIcon>
  )
}

function IconSettings() {
  return (
    <SvgIcon>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <line x1="16" y1="4" x2="16" y2="8" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="16" x2="16" y2="20" />
    </SvgIcon>
  )
}

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="var(--color-accent)" />
      <path d="M5 7h10M5 10h7M5 13h9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const s = {
  sidebar: {
    width: 'var(--sidebar-w)',
    minWidth: 'var(--sidebar-w)',
    background: 'var(--color-sidebar)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflowY: 'auto',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-5) var(--space-4)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--space-2)',
  },
  logoMark: { flexShrink: 0 },
  brandName: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--color-text)',
    letterSpacing: '-0.01em',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    padding: '0 var(--space-3)',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '9px var(--space-3)',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--color-text-2)',
    transition: 'background 0.12s, color 0.12s',
  },
  linkActive: {
    background: 'var(--color-accent-subtle)',
    color: 'var(--color-accent)',
    fontWeight: 600,
  },
  linkIcon: { color: 'var(--color-text-3)', flexShrink: 0, transition: 'color 0.12s' },
  linkIconActive: { color: 'var(--color-accent)' },
  footer: {
    padding: 'var(--space-4)',
    borderTop: '1px solid var(--color-border)',
  },
  localBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '12px',
    color: 'var(--color-text-3)',
    fontWeight: 500,
  },
  localDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--color-success)',
    flexShrink: 0,
  },
  bottomNav: {
    display: 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    zIndex: 50,
    padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
  },
  bottomTab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    textDecoration: 'none',
    padding: '4px 0',
  },
  bottomTabActive: {},
  bottomTabLabel: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'inherit',
  },
}
