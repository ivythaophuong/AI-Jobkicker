import React from 'react';
import { LogoMark } from '../features/Landing/LandingPage';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard', icon: '⚡', label: 'Dashboard', badge: null },
    ],
  },
  {
    label: 'Layer 01 · Get Seen',
    items: [
      { id: 'scan',  icon: '⚡', label: 'Resume Scan',   badge: 'live' },
      { id: 'ats',   icon: '✨', label: 'ATS Builder',   badge: 'live' },
      { id: 'cover', icon: '✉️', label: 'Cover Letter',  badge: 'live' },
    ],
  },
  {
    label: 'Layer 02 · Get Ready',
    items: [
      { id: 'simulate', icon: '🧠', label: 'Interview Coach', badge: 'live' },
      { id: 'star',     icon: '⭐', label: 'STAR Builder',    badge: 'live' },
      { id: 'salary',   icon: '💰', label: 'Salary Coach',    badge: 'live' },
      { id: 'radar',    icon: '📡', label: 'Weakness Radar',  badge: 'live' },
      { id: 'score',    icon: '🏆', label: 'Readiness Score', badge: 'live' },
      { id: 'skillsgap',icon: '📊', label: 'Skills Gap',      badge: 'new'  },
      { id: 'roadmap',  icon: '🗺️', label: 'Career Roadmap',  badge: 'new'  },
    ],
  },
  {
    label: 'Layer 03 · Get Verified',
    items: [
      { id: 'trustmatch', icon: '🛡️', label: 'Trust & Verify', badge: 'dev' },
    ],
  },
  {
    label: 'Layer 04 · Get Matched',
    items: [
      { id: 'jobs',   icon: '🔎', label: 'Job Search',   badge: 'live' },
      { id: 'jd',     icon: '🔍', label: 'JD Analyzer',  badge: 'live' },
      { id: 'market', icon: '🌏', label: 'Market Intel',  badge: 'live' },
      { id: 'memory', icon: '🧬', label: 'AI Memory',     badge: 'live' },
      { id: 'aichat', icon: '🤖', label: 'AI Coach',      badge: 'new'  },
    ],
  },
];

const BADGE_CLASS = { live: 'snb-live', new: 'snb-new', dev: 'snb-dev', planned: 'snb-planned' };
const BADGE_LABEL = { live: 'Live', new: 'New', dev: 'In dev', planned: 'Planned' };

// Mobile: only show the 5 most important items in bottom bar
const MOBILE_ITEMS = ['dashboard', 'scan', 'simulate', 'jobs', 'aichat'];

function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AppSidebar({ activeModule, onNavigate, user, onLogout, memory }) {
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const mobileItems = allItems.filter(i => MOBILE_ITEMS.includes(i.id));

  return (
    <>
      {/* Desktop sidebar */}
      <div className="app-sidebar">
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
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`app-sidebar-item${activeModule === item.id ? ' active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="app-sidebar-icon">{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  {item.badge && (
                    <span className={`app-sidebar-badge ${BADGE_CLASS[item.badge] || ''}`}>
                      {BADGE_LABEL[item.badge]}
                    </span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* User bar */}
        <div className="app-sidebar-user">
          <div className="app-sidebar-avatar">{initials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--lp-text3)' }}>{user?.email?.split('@')[0]}</div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            style={{ background: 'transparent', border: 'none', color: 'var(--lp-text3)', cursor: 'pointer', fontSize: 14, padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            ↩
          </button>
        </div>
      </div>

      {/* Mobile bottom nav — shows only key 5 items */}
      <div
        className="app-sidebar"
        style={{ display: 'none' }}  // CSS media query shows this on mobile
      >
        <nav className="app-sidebar-nav">
          {mobileItems.map(item => (
            <button
              key={item.id}
              className={`app-sidebar-item${activeModule === item.id ? ' active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="app-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
