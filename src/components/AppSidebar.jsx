import React from 'react';
import { LogoMark } from '../features/Landing/LandingPage';

// ── SVG icon set — 16×16 viewBox, stroke-based ───────────────────────────────
function Icon({ id, size = 15, color = 'currentColor' }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'dashboard':
      return <svg viewBox="0 0 16 16" style={s}><rect {...p} x="1" y="1" width="6" height="6" rx="1.2"/><rect {...p} x="9" y="1" width="6" height="6" rx="1.2"/><rect {...p} x="1" y="9" width="6" height="6" rx="1.2"/><rect {...p} x="9" y="9" width="6" height="6" rx="1.2"/></svg>;
    case 'ats':
      return <svg viewBox="0 0 16 16" style={s}><path {...p} d="M3 2h7l3 3v9H3V2z"/><path {...p} d="M10 2v3h3"/><path {...p} d="M5 7h6M5 10h4"/></svg>;
    case 'scan':
      return <svg viewBox="0 0 16 16" style={s}><path {...p} d="M1 5V3a2 2 0 012-2h2M11 1h2a2 2 0 012 2v2M15 11v2a2 2 0 01-2 2h-2M5 15H3a2 2 0 01-2-2v-2"/><circle {...p} cx="8" cy="8" r="2.5"/></svg>;
    case 'cover':
      return <svg viewBox="0 0 16 16" style={s}><rect {...p} x="1" y="3" width="14" height="10" rx="1.5"/><path {...p} d="M1 5l7 5 7-5"/></svg>;
    case 'simulate':
      return <svg viewBox="0 0 16 16" style={s}><circle {...p} cx="8" cy="8" r="6.5"/><path {...p} d="M5.5 6c0-1.1.9-2 2.5-2s2.5.9 2.5 2c0 1.5-2.5 2-2.5 3.5"/><circle fill={color} stroke="none" cx="8" cy="12" r=".8"/></svg>;
    case 'salary':
      return <svg viewBox="0 0 16 16" style={s}><circle {...p} cx="8" cy="8" r="6.5"/><path {...p} d="M8 4.5v7M6 6.5c0-.9.9-1.5 2-1.5s2 .7 2 1.5S9 8 8 8s-2 .6-2 1.5S6.9 11 8 11s2-.6 2-1.5"/></svg>;
    case 'skillsgap':
      return <svg viewBox="0 0 16 16" style={s}><path {...p} d="M1 13l4-5 3 3 3-4 4-3"/><circle {...p} cx="1" cy="13" r=".8"/></svg>;
    case 'roadmap':
      return <svg viewBox="0 0 16 16" style={s}><circle {...p} cx="3" cy="13" r="1.5"/><circle {...p} cx="8" cy="3" r="1.5"/><circle {...p} cx="13" cy="9" r="1.5"/><path {...p} d="M3 11.5V7l5-3.5M8 4.5l5 4"/></svg>;
    case 'verify':
      return <svg viewBox="0 0 16 16" style={s}><path {...p} d="M8 1L2 4v4c0 3.5 2.7 6.2 6 7 3.3-.8 6-3.5 6-7V4L8 1z"/><path {...p} d="M5.5 8l2 2 3-3"/></svg>;
    case 'trustmatch':
      return <svg viewBox="0 0 16 16" style={s}><path {...p} d="M5 8.5C5 7.1 6.1 6 7.5 6S10 7.1 10 8.5V10H5V8.5z"/><path {...p} d="M1 14v-1.5C1 11.1 2.3 10 4 10M15 14v-1.5C15 11.1 13.7 10 12 10M4 7.5A2 2 0 104 3.5M12 7.5A2 2 0 1012 3.5"/></svg>;
    case 'aichat':
      return <svg viewBox="0 0 16 16" style={s}><rect {...p} x="1" y="2" width="14" height="9" rx="2"/><path {...p} d="M4 14l2-3M12 14l-2-3"/><path {...p} d="M5 6.5h6M5 8.5h4"/></svg>;
    default:
      return <svg viewBox="0 0 16 16" style={s}><circle {...p} cx="8" cy="8" r="6"/></svg>;
  }
}

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard', label: 'Dashboard',     badge: null      },
    ],
  },
  {
    label: 'Get Seen',
    items: [
      { id: 'ats',   label: 'Resume Builder',  badge: 'live' },
      { id: 'scan',  label: 'ATS Scanner',     badge: 'live' },
      { id: 'cover', label: 'Cover Letter AI', badge: 'new'  },
    ],
  },
  {
    label: 'Get Ready',
    items: [
      { id: 'simulate',  label: 'Interview Coach', badge: 'live' },
      { id: 'salary',    label: 'Salary Prep',     badge: 'live' },
      { id: 'skillsgap', label: 'Skills Gap',      badge: 'new'  },
      { id: 'roadmap',   label: 'Career Roadmap',  badge: 'new'  },
    ],
  },
  {
    label: 'Get Verified',
    items: [
      { id: 'verify', label: 'Verify Creds', badge: 'dev' },
    ],
  },
  {
    label: 'Get Matched',
    items: [
      { id: 'trustmatch', label: 'TrustMatch',     badge: 'planned' },
      { id: 'aichat',     label: 'AI Career Coach', badge: 'new'    },
    ],
  },
];

const BADGE_CLASS  = { live: 'snb-live', new: 'snb-new', dev: 'snb-dev', planned: 'snb-planned' };
const BADGE_LABEL  = { live: 'Live', new: 'New', dev: 'In dev', planned: 'Planned' };

const INTERVIEW_COACH_IDS = ['simulate', 'star', 'radar', 'score', 'memory'];
const MOBILE_ITEMS        = ['dashboard', 'scan', 'simulate', 'trustmatch', 'aichat'];

function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AppSidebar({ activeModule, onNavigate, user, onLogout, collapsed, onToggle }) {
  const allItems   = NAV_GROUPS.flatMap(g => g.items);
  const mobileItems = allItems.filter(i => MOBILE_ITEMS.includes(i.id));

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="app-sidebar-logo">
          <LogoMark size={26} />
          <div className="app-sidebar-logo-name">CareerAiHub</div>
        </div>

        {/* Nav groups */}
        <nav className="app-sidebar-nav">
          {NAV_GROUPS.map((group, gi) => (
            <React.Fragment key={gi}>
              {group.label && (
                <div className="app-sidebar-sep">{group.label}</div>
              )}
              {group.items.map(item => {
                const active = activeModule === item.id || (item.id === 'simulate' && INTERVIEW_COACH_IDS.includes(activeModule));
                return (
                  <button
                    key={item.id}
                    className={`app-sidebar-item${active ? ' active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="app-sidebar-icon">
                      <Icon id={item.id} size={15} color={active ? 'var(--lp-teal)' : 'var(--lp-text3)'} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="sni-lbl" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        {item.badge && (
                          <span className={`app-sidebar-badge ${BADGE_CLASS[item.badge] || ''}`}>
                            {BADGE_LABEL[item.badge]}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* User bar */}
        <div className="app-sidebar-user" title={collapsed ? (user?.name || 'User') : undefined}>
          <div className="app-sidebar-avatar">{initials(user?.name)}</div>
          {!collapsed && (
            <>
              <div className="app-sidebar-user-text" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--lp-text3)' }}>{user?.email?.split('@')[0]}</div>
              </div>
              <button
                className="app-sidebar-logout"
                onClick={onLogout}
                title="Sign out"
                style={{ background: 'transparent', border: 'none', color: 'var(--lp-text3)', cursor: 'pointer', padding: 4, lineHeight: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}
              >
                <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 8H2M5 5l-3 3 3 3M8 4V3a1 1 0 011-1h4a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1v-1"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '10px 0',
            background: 'transparent', border: 'none',
            borderTop: '1px solid var(--lp-bdr, rgba(0,212,255,.08))',
            color: 'var(--lp-text3)', cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--lp-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--lp-text3)'}
        >
          <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <path d="M6 3l5 5-5 5"/>
              : <path d="M10 3L5 8l5 5"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="app-sidebar" style={{ display: 'none' }}>
        <nav className="app-sidebar-nav">
          {mobileItems.map(item => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                className={`app-sidebar-item${active ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="app-sidebar-icon">
                  <Icon id={item.id} size={15} color={active ? 'var(--lp-teal)' : 'var(--lp-text3)'} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
